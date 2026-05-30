from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.admin import AdminCreate, AdminUpdate, AdminOut
from app.services.admin import (
    create_admin, get_admin, get_admins, update_admin, delete_admin,
    manage_users, get_audit_logs, generate_report
)
from app.core.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/", response_model=AdminOut)
def create_admin_endpoint(admin_in: AdminCreate, db: Session = Depends(get_db)):
    return create_admin(db, admin_in)

@router.get("/{admin_id}", response_model=AdminOut)
def read_admin(admin_id: int, db: Session = Depends(get_db)):
    admin = get_admin(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin

@router.get("/", response_model=list[AdminOut])
def list_admins(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_admins(db, skip=skip, limit=limit)

@router.put("/{admin_id}", response_model=AdminOut)
def update_admin_endpoint(admin_id: int, admin_in: AdminUpdate, db: Session = Depends(get_db)):
    return update_admin(db, admin_id, admin_in)

@router.delete("/{admin_id}")
def delete_admin_endpoint(admin_id: int, db: Session = Depends(get_db)):
    delete_admin(db, admin_id)
    return {"ok": True}

# Business logic endpoints
@router.get("/users/")
def manage_users_endpoint(db: Session = Depends(get_db)):
    return manage_users(db)

@router.get("/audit-logs/")
def get_audit_logs_endpoint(db: Session = Depends(get_db)):
    return get_audit_logs(db)

@router.get("/report/")
def generate_report_endpoint(db: Session = Depends(get_db)):
    return generate_report(db)
