## TCU Tracking Instructions (Include in ALL agent files)

### Required at Start of Every Task:
1. Read current system memory: `/Users/chris/2org-inspectorsnearme/.claude/memory/system_memory.json`
2. Log task start: Update `tcu_spent` field with estimated TCU cost
3. Set task status in memory

### Required During Task Execution:
- Log significant milestones (every 5-10 actions)
- Update efficiency metrics in real-time
- Alert if approaching individual TCU allocation limit

### Required at Task Completion:
1. Update final TCU consumption in system memory
2. Log task results and efficiency metrics
3. Trigger heartbeat manager if 10+ TCUs consumed since last heartbeat
4. Update relevant specialized memory files

### Memory Update Format:
```json
{
  "task_id": "unique_task_identifier", 
  "agent_name": "your_agent_name",
  "tcu_consumed": X,
  "efficiency_score": X,
  "timestamp": "ISO_datetime",
  "results": "task_outcome_summary"
}
```

### Heartbeat Trigger:
If `total_tcu_spent % 10 == 0`, immediately call def-heartbeat-manager for system health check.