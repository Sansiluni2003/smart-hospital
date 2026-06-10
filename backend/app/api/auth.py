from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token, get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic_staff import ClinicStaff

router = APIRouter(tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Step 1: Authenticate the user by email and password
    user = db.query(User).filter(User.Email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.Password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    patient_id = None
    doctor_id = None
    staff_id = None

    # Step 2: Check the user's role and perform role-specific actions
    if user.Role.value == "Patient":
        patient = db.query(Patient).filter(Patient.UserID == user.UserID).first()
        
        # Check if a patient record exists for the user
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Patient record not found for this user."
            )
        
        # --- NEW: Check if the patient account is active ---
        # This checks the `is_active` boolean column in the Patient table.
        if not patient.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is not active. Please wait until your account is activated by an administrator."
            )
        # ---------------------------------------------------
        
        patient_id = patient.Patient_ID

    elif user.Role.value == "Doctor":
        doctor = db.query(Doctor).filter(Doctor.UserID == user.UserID).first()
        if doctor:
            doctor_id = doctor.Doctor_ID

    elif user.Role.value == "Staff":
        staff = db.query(ClinicStaff).filter(ClinicStaff.UserID == user.UserID).first()
        if staff:
            staff_id = staff.Staff_ID

    # Step 3: If all checks pass, create and return the access token
    access_token = create_access_token(data={"sub": str(user.UserID), "role": user.Role.value})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "UserID": user.UserID,
            "Email": user.Email,
            "Role": user.Role.value,
            "Patient_ID": patient_id,
            "Doctor_ID": doctor_id,
            "Staff_ID": staff_id,
        }
    }
