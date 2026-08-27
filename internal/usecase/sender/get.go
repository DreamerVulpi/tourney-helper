package sender

import (
	"context"
	"time"

	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	entityPlatformRules "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
)

func (ns *NotificationSystem) GetMessengerMetrics() entityMetrics.Snapshot {
	snapshot := ns.MetricsMessenger.Snapshot()
	total := ns.TotalMessages.Load()
	sent := ns.MessagesSentCurrentCycle.Load()
	remaining := total - sent
	if remaining < 0 {
		remaining = 0
	}

	snapshot.EstimateRemainingMs = ns.MetricsMessenger.EstimateRemaining(remaining).Milliseconds()
	return snapshot
}

func (ns *NotificationSystem) GetTournamentPlatformMetrics() entityMetrics.Snapshot {
	return ns.MetricsTournamentPlatform.Snapshot()
}

func (ns *NotificationSystem) GetMessengerLimits() entityPlatformRules.Limits {
	return ns.LimiterMessenger.Limits()
}

func (ns *NotificationSystem) GetMessengerMessageLimit() int64 {
	if ns.LimiterMessenger == nil {
		return 0
	}

	if ns.Messenger == nil {
		return 0
	}

	limits := ns.LimiterMessenger.Limits()

	if ns.Messenger.IsLogChannelEnabled() {
		return limits.MessagesPerMinute / 2
	}
	return limits.MessagesPerMinute
}

func (ns *NotificationSystem) GetTournamentPlatformLimits() entityPlatformRules.Limits {
	return ns.LimiterTournamentPlatform.Limits()
}

func (ns *NotificationSystem) IsReady() bool {
	return ns.Messenger != nil
}

func (ns *NotificationSystem) getDebugDMChannel(ctx context.Context) (string, error) {
	start := time.Now()
	if ns.TestContact.DmChannelId != nil && *ns.TestContact.DmChannelId != "" {
		return *ns.TestContact.DmChannelId, nil
	}

	channel, err := ns.Messenger.CreateDMChannel(ctx, ns.TestContact.MessengerID)
	if err != nil {
		return "", err
	}

	ns.TestContact.DmChannelId = channel
	ns.MetricsMessenger.RecordAPIRequest(err, time.Since(start))
	return *channel, nil
}
