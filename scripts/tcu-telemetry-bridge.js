#!/usr/bin/env node

/**
 * TCU-OpenTelemetry Bridge
 * Integrates custom TCU tracking with Claude Code's OpenTelemetry system
 */

const fs = require('fs');
const path = require('path');

class TCUTelemetryBridge {
  constructor() {
    this.memoryPath = path.join(__dirname, '../.claude/memory/system_memory.json');
    this.isClaudeCodeContext = process.env.CLAUDE_CODE_SESSION_ID ? true : false;
  }

  /**
   * Export TCU metrics to OTEL format
   */
  exportTCUMetrics() {
    try {
      const memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
      const metrics = {
        'tcu.spent.total': memory.business_metrics.tcu_spent || 0,
        'tcu.efficiency.rate': this.calculateEfficiency(memory),
        'tcu.burn.rate': this.calculateBurnRate(memory),
        'listings.per.tcu': memory.business_metrics.total_listings / Math.max(memory.business_metrics.tcu_spent, 1),
        'revenue.per.tcu': memory.business_metrics.monthly_revenue / Math.max(memory.business_metrics.tcu_spent, 1)
      };

      // Export to Claude Code telemetry if available
      if (this.isClaudeCodeContext) {
        this.exportToClaudeCode(metrics);
      }

      // Always export to console for debugging
      console.log('TCU Metrics:', JSON.stringify(metrics, null, 2));
      
      return metrics;
    } catch (error) {
      console.error('TCU Telemetry Export Error:', error);
      return null;
    }
  }

  /**
   * Export metrics to Claude Code's OpenTelemetry system
   */
  exportToClaudeCode(metrics) {
    // Set OTEL resource attributes for TCU tracking
    const resourceAttributes = [
      'tcu.project=inspectorsnearme',
      'tcu.phase=' + this.determinePhase(metrics['tcu.spent.total']),
      'business.type=directory'
    ].join(',');

    process.env.OTEL_RESOURCE_ATTRIBUTES = resourceAttributes;
    
    // Log structured metrics for OTEL collection
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`METRIC ${key}=${value}`);
    });
  }

  calculateEfficiency(memory) {
    const spent = memory.business_metrics.tcu_spent || 0;
    const listings = memory.business_metrics.total_listings || 0;
    return spent > 0 ? listings / spent : 0;
  }

  calculateBurnRate(memory) {
    // Calculate TCUs per day based on optimization history
    const history = memory.optimization_history || [];
    if (history.length < 2) return 0;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const timeDiff = (new Date(latest.timestamp) - new Date(previous.timestamp)) / (1000 * 60 * 60 * 24);
    const tcuDiff = latest.tcu_consumed - previous.tcu_consumed;
    
    return timeDiff > 0 ? tcuDiff / timeDiff : 0;
  }

  determinePhase(tcuSpent) {
    if (tcuSpent <= 500) return 'foundation';
    if (tcuSpent <= 2500) return 'mvp-build';
    if (tcuSpent <= 4000) return 'launch';
    return 'growth';
  }

  /**
   * Update system memory with new TCU consumption
   */
  updateTCU(agentName, tcuConsumed, taskResults = {}) {
    try {
      const memory = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
      
      // Update total TCU consumption
      memory.business_metrics.tcu_spent += tcuConsumed;
      
      // Log optimization entry
      memory.optimization_history.push({
        timestamp: new Date().toISOString(),
        agent: agentName,
        tcu_consumed: tcuConsumed,
        task_results: taskResults,
        cumulative_tcu: memory.business_metrics.tcu_spent
      });

      // Trigger heartbeat if needed
      if (memory.business_metrics.tcu_spent % 10 === 0) {
        this.triggerHeartbeat(memory.business_metrics.tcu_spent);
      }

      fs.writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2));
      
      // Export updated metrics
      this.exportTCUMetrics();
      
      console.log(`TCU Update: ${agentName} consumed ${tcuConsumed} TCUs. Total: ${memory.business_metrics.tcu_spent}`);
      
    } catch (error) {
      console.error('TCU Update Error:', error);
    }
  }

  triggerHeartbeat(totalTCU) {
    console.log(`🔔 HEARTBEAT TRIGGER: ${totalTCU} TCUs consumed - Running system health check`);
    // This would trigger the heartbeat manager agent
    // For now, just log the event
  }
}

// CLI interface
if (require.main === module) {
  const bridge = new TCUTelemetryBridge();
  
  const command = process.argv[2];
  const agentName = process.argv[3];
  const tcuAmount = parseInt(process.argv[4]);
  
  switch (command) {
    case 'update':
      if (!agentName || !tcuAmount) {
        console.error('Usage: node tcu-telemetry-bridge.js update <agent_name> <tcu_amount>');
        process.exit(1);
      }
      bridge.updateTCU(agentName, tcuAmount);
      break;
      
    case 'export':
      bridge.exportTCUMetrics();
      break;
      
    default:
      console.log('Available commands: update, export');
  }
}

module.exports = TCUTelemetryBridge;