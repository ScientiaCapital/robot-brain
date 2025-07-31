"""
PayrollSupervisor - specialized supervisor for payroll teams.
"""

from typing import Dict, Any, List
from src.langgraph_supervisor import VerticalSupervisor


class PayrollSupervisor(VerticalSupervisor):
    """Supervisor specifically for payroll teams."""
    
    def __init__(self, agents: Dict[str, Any], config: Dict[str, Any]):
        # Set vertical to payroll
        config_with_vertical = config.copy()
        config_with_vertical["vertical"] = "payroll"
        super().__init__("payroll", agents, config_with_vertical)
    
    async def process_payroll(
        self, 
        employees: List[Dict[str, Any]], 
        pay_period: str
    ) -> Dict[str, Any]:
        """Process payroll for employees."""
        # Build workflow steps
        workflow_steps = [
            {"agent": "PayrollProcessor", "task": "process_timesheets"},
            {"agent": "TaxCalculator", "task": "calculate_taxes"},
            {"agent": "ComplianceAgent", "task": "check_compliance"}
        ]
        
        # Process employees
        processed = []
        for emp in employees:
            emp_data = emp.copy()
            
            # Calculate overtime
            if emp_data["hours"] > 40:
                emp_data["overtime_hours"] = emp_data["hours"] - 40
                emp_data["gross_pay"] = (40 * emp_data["rate"]) + (emp_data["overtime_hours"] * emp_data["rate"] * 1.5)
            else:
                emp_data["overtime_hours"] = 0
                emp_data["gross_pay"] = emp_data["hours"] * emp_data["rate"]
            
            processed.append(emp_data)
        
        return {
            "status": "success",
            "pay_period": pay_period,
            "processed_employees": processed,
            "workflow_steps": workflow_steps
        }