package sender

import (
	"context"
	"time"

	entityMetrics "github.com/dreamervulpi/tourney-helper/internal/entity/metrics"
	entityPlatformRules "github.com/dreamervulpi/tourney-helper/internal/entity/platformRules"
)

func (ns *NotificationSystem) GetMessengerMetrics() entityMetrics.Snapshot {
	snapshot := ns.MetricsDeliveryMethod.Snapshot()
	total := ns.TotalMessages.Load()
	sent := ns.MessagesSentCurrentCycle.Load()
	remaining := total - sent
	if remaining < 0 {
		remaining = 0
	}

	snapshot.EstimateRemainingMs = ns.MetricsDeliveryMethod.EstimateRemaining(remaining).Milliseconds()
	return snapshot
}

func (ns *NotificationSystem) GetTournamentPlatformMetrics() entityMetrics.Snapshot {
	return ns.MetricsTournamentPlatform.Snapshot()
}

func (ns *NotificationSystem) GetMessengerLimits() entityPlatformRules.Limits {
	return ns.LimiterDeliveryMethod.Limits()
}

func (ns *NotificationSystem) GetMessengerMessageLimit() int64 {
	if ns.LimiterDeliveryMethod == nil {
		return 0
	}

	if ns.DeliveryMethod == nil {
		return 0
	}

	limits := ns.LimiterDeliveryMethod.Limits()

	if ns.DeliveryMethod.IsLogChannelEnabled() {
		return limits.MessagesPerMinute / 2
	}
	return limits.MessagesPerMinute
}

func (ns *NotificationSystem) GetTournamentPlatformLimits() entityPlatformRules.Limits {
	return ns.LimiterTournamentPlatform.Limits()
}

func (ns *NotificationSystem) IsReady() bool {
	return ns.DeliveryMethod != nil
}

func (ns *NotificationSystem) getDebugDMChannel(ctx context.Context) (string, error) {
	start := time.Now()
	if ns.TestContact.DmChannelId != nil && *ns.TestContact.DmChannelId != "" {
		return *ns.TestContact.DmChannelId, nil
	}

	channel, err := ns.DeliveryMethod.CreateDMChannel(ctx, ns.TestContact.MessengerID)
	if err != nil {
		return "", err
	}

	ns.TestContact.DmChannelId = channel
	ns.MetricsDeliveryMethod.RecordAPIRequest(err, time.Since(start))
	return *channel, nil
}
