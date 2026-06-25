# Queue Notification System Documentation

## Overview

The Smart Hospital system now includes a comprehensive real-time queue notification system that keeps patients informed about their position in the queue and notifies them when doctors arrive and start consulting.

## How It Works

### 1. Doctor Starts Consultation

When a doctor clicks "Start Consultation" on the first patient in their queue:

1. **Active Patient Notification**: The patient being consulted receives an immediate notification:
   - Title: "🏥 Consultation Started"
   - Message: "Dr. [Doctor Name] has started your consultation. Please proceed to the room immediately."

2. **Waiting Patients - Doctor Arrival**: All other patients waiting in the same queue receive:
   - Title: "👨‍⚕️ Doctor Has Arrived"
   - Message: "Dr. [Doctor Name] has arrived and is now consulting. Your turn will be announced shortly."

3. **Queue Position Updates**: All waiting patients receive detailed position notifications:
   - **First in queue**: 
     - Title: "🎯 You are Up Next!"
     - Message: "Dr. [Doctor Name] is ready to see you now. Please proceed to the consultation room immediately."
   
   - **2nd in queue**:
     - Title: "📊 Queue Update - Position 2"
     - Message: "Dr. [Doctor Name] has arrived and is now consulting. You are 1 ahead, you will be next in the queue."
   
   - **3rd onwards**:
     - Title: "📊 Queue Update - Position N"
     - Message: "Dr. [Doctor Name] has arrived and is now consulting. You are N-1 ahead in the queue."

### 2. Notification Delivery

Notifications are delivered through **two channels**:

#### Real-Time WebSocket (Primary)
- Instant delivery over WebSocket connection
- No delay, updates patients immediately
- Automatic UI refresh on the patient's queue page

#### Backup Database Notifications
- Saved in the database as in-app notifications
- Displayed in the patient's notification drawer
- Provides notification history

### 3. Queue Position Message Format

The system provides clear, easy-to-understand position messages:

```
Position 1 (Next): "You are Up Next!"
Position 2: "You are 1 ahead, you will be next"
Position 3+: "You are {N} ahead"
```

## User Experience Flow

### For Patients

1. **Before Doctor Arrives**: Patient sees their appointment details and estimated wait time
2. **Doctor Arrives**: Patient receives "Doctor Has Arrived" notification
3. **Queue Updates**: Patient receives their exact position with clear messaging
4. **Called Next**: Patient receives "You are Up Next!" notification to prepare
5. **Consultation Starts**: Patient receives "Consultation Started" notification when their turn begins

### For Doctors

1. Doctor goes to Queue page
2. Clicks "Start Consultation" on first patient
3. System automatically notifies:
   - Active patient
   - All waiting patients about arrival
   - All waiting patients about their new queue position

## Technical Implementation

### Backend Components

#### notify.py
- **EVT_DOCTOR_ARRIVED**: New event type for doctor arrival notifications
- **EVT_QUEUE_UPDATE**: Queue position update event
- **notify_patient()**: Sends notifications to specific patients

#### doctor.py Service
- **start_doctor_consultation()**: Triggers all notifications when consultation starts
- **_notify_queue_updates()**: Sends position updates to waiting patients

### Frontend Components

#### RealtimeNotifications.tsx
- Handles notification display and routing
- Listens to: `doctor_arrived`, `queue_update`, `consultation_started`
- Routes users to appropriate pages on notification click

#### Patient Queue Page
- Listens to: `doctor_arrived`, `queue_update`, `consultation_started`, `checkin_verified`, `patient_arrived`
- Auto-refreshes queue status on any event
- Displays live queue position and doctor info

#### Doctor Queue Page
- Listens to: `doctor_arrived`, `queue_update`, `consultation_started`
- Shows current patient and waiting queue
- Updates in real-time as patients progress

## Database Schema

### Notification Model
```python
- notification_id
- patient_id (FK)
- event_type (e.g., "queue_update", "doctor_arrived")
- title
- message
- data (JSON: appointment_id, queue_position, doctor_name, etc.)
- created_at
- is_read
```

### LiveQueue Model
```python
- AppointmentID (FK)
- Status (Waiting, In_Consultation, Completed, Skipped)
- Queue_Number
- Queue_Position (calculated)
```

## Configuration

### Polling Intervals

**Patient Queue Page**:
- WebSocket mode: 10-second polling fallback
- Manual mode: 30-second polling

**Doctor Queue Page**:
- 20-second auto-refresh (WebSocket triggers instant refresh)

**Doctor Consultation Page**:
- 10-second polling with WebSocket instant refresh

## Error Handling

- If WebSocket connection fails, automatic fallback to polling
- Notifications are queued in the database if delivery fails
- Patient can always manually refresh to see latest queue status
- No notifications block the main transaction

## Testing the System

### Manual Test Flow

1. **Setup**:
   - Create 3+ appointments for same doctor on same date
   - Check in all patients to get them "Arrived" status

2. **Test**:
   - Doctor goes to Queue page
   - Patient 1 opens Queue page in browser
   - Patient 2 opens Queue page in browser
   - Doctor clicks "Start Consultation" on Patient 1
   
3. **Verify**:
   - Patient 1 sees "Consultation Started" notification
   - Patient 2 sees "Doctor Has Arrived" notification
   - Patient 2 sees "You are Up Next!" message
   - All notifications appear in notification drawer

### WebSocket Verification

Check browser DevTools → Network → WS:
- Should see WebSocket messages for each notification
- Message format: `{"event": "...", "title": "...", "message": "...", "data": {...}}`

## Files Modified

### Backend
- `backend/app/services/doctor.py`: Enhanced start_doctor_consultation() and _notify_queue_updates()
- `backend/app/utils/notify.py`: Added EVT_DOCTOR_ARRIVED event type

### Frontend
- `frontend/app/components/RealtimeNotifications.tsx`: Updated event icons and routing
- `frontend/app/patient/queue/page.tsx`: Added doctor_arrived event listener
- `frontend/app/doctor/queue/page.tsx`: Added WebSocket support with event listeners
- `frontend/app/doctor/consultation/page.tsx`: Added WebSocket support with event listeners

## Future Enhancements

1. **Audio Notifications**: Play sound when doctor arrives
2. **SMS/Email**: Send SMS to patients with queue position
3. **Push Notifications**: Native browser push notifications
4. **ETA Calculations**: Show estimated time to consultation
5. **Multiple Clinics**: Notify patients across clinic networks
6. **Doctor Status**: Show when doctor is running late

## Support & Debugging

### Common Issues

**Notifications not appearing?**
- Check WebSocket connection in DevTools
- Verify patient has opened appointment page
- Check database for notification records
- Verify event types match (case-sensitive)

**Queue position incorrect?**
- Verify appointments are ordered by Queue_Number
- Check appointment statuses (should be Allocated or Arrived)
- Ensure only one doctor per appointment

**Slow notifications?**
- Check database connection
- Verify WebSocket server is running
- Monitor network latency

### Debug Mode

Enable console logging:
```javascript
// In browser console
localStorage.setItem('DEBUG_NOTIFICATIONS', 'true');
```

This will log all WebSocket events and notification calls.
