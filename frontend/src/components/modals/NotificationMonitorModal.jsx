import React, { useState, useEffect } from "react";
import { Field } from "../ui/Field.jsx";
import { Modal } from "./Modal.jsx";
import { Book, Bug, Coins, GitBranch, HandCoins, Info, Monitor, Recycle, RecycleIcon, Rss, Settings, Upload, Mails, Download, Timer, Clock3 } from "lucide-react";
import { MessageBox } from "./MessageBox.jsx";
import { useNotificationMetrics } from "../../hooks/NotificationSystemPanel/useNotificationMetrics.jsx";
import { useGetDataMetrics } from "../../hooks/NotificationSystemPanel/useGetDataMetrics.jsx";
import { formatDuration } from "../../utils/NotificationSystemPanel.jsx/formatDuration.jsx";
import { GetNotificationLimits } from "../../../wailsjs/go/application/App.js";
import { GetTournamentPlatformLimits } from "../../../wailsjs/go/application/App.js";
import { GetMessengerMessageLimit } from "../../../wailsjs/go/application/App.js";

const NotificationMonitorModal = ({
  isOpen,
  onClose,
  locale,
  themeClasses,
  layer,
}) => {

  if (!isOpen) return null;

  const blueDesign = {
      iconColor: "text-blue-500",
      borderClass: "border-blue-500/20 bg-blue-500/10",
  }
  const amberDesign = {
      iconColor: "text-amber-500",
      borderClass: "border-amber-500/20 bg-amber-500/10",
  }
  const textClass = "text-base uppercase font-bold italic"

  const snapshotSender = useNotificationMetrics(isOpen);
  const totalsSender = snapshotSender?.Totals;
  const currentSender = snapshotSender?.Current;
  const stateSender = snapshotSender?.State;

  const snapshotGetter = useGetDataMetrics(isOpen);
  const totalsGetter = snapshotGetter?.Totals;
  const currentGetter = snapshotGetter?.Current;
  const stateggGetter = snapshotGetter?.State;

  const [limitsMessenger, setM] = useState(null);
  const [limitsMessages, setMM] = useState(null);
  const [limitsTournamentPlatform, setTP] = useState(null);

  useEffect(()=>{
    async function loadLimits(){
      const resultM = await GetNotificationLimits();
      setM(resultM)
      const resultTP = await GetTournamentPlatformLimits();
      setTP(resultTP)
      const resultMM = await GetMessengerMessageLimit();
      setMM(resultMM)
    }
    loadLimits();
  }, []);
  

  const content = (
    <div className={`p-6 max-h-[70vh] overflow-y-auto space-y-6`}>
      <div className="flex gap-4">
            <div className="w-[50%] flex flex-col gap-4">
                <MessageBox
                    layout="left"
                    icon={Mails}
                    iconColor={blueDesign.iconColor}
                    borderClass={blueDesign.borderClass}
                    iconSize={36}
                    textClass={textClass}
                    >
                    {locale.MessagesLabel}{" Discord"}
                </MessageBox>
                <Field
                  variant="mono"
                  value={
                    <>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.LimitRequestPerMinute}</span>
                        <span className="font-bold truncate text-right">{currentSender?.MessageAttemptsLastMinute}/{limitsMessages}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalSuccessSent}</span>
                        <span className="font-bold truncate text-right text-green-500">{totalsSender?.MessagesSuccess}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalAttemptsSent}</span>
                        <span className="font-bold">{totalsSender?.MessagesAttempts}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        {/* TODO: Add change color (If >85% - green, > 65% - yellow, < 65% - red) */}
                        <span className="opacity-50">{locale.SuccessRate}</span>
                        <span className="font-bold text-yellow-500">{totalsSender?.MessageSuccessRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.AverageTime}</span>
                        <span className="font-bold">{totalsSender?.MessageDuration.AverageMs} {locale.Ms}</span>
                      </div>
                    </>
                  }
                  themeClasses={themeClasses}
                />
            </div>
            <div className="w-[50%] flex flex-col gap-4">
                <MessageBox
                    layout="left"
                    icon={Download}
                    iconColor={amberDesign.iconColor}
                    borderClass={amberDesign.borderClass}
                    iconSize={36}
                    textClass={textClass}
                    >
                    {"Discord API"}
                </MessageBox>
                <Field
                  variant="mono"
                  value={
                    <>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.LimitRequestPerSecond}</span>
                        <span className="font-bold truncate text-right">{currentSender?.RequestAttemptsLastSecond}/{limitsMessenger?.RequestPerSecond}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalSuccessSent}</span>
                        <span className="font-bold truncate text-right text-green-500">{totalsSender?.RequestSuccess}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalAttemptsSent}</span>
                        <span className="font-bold">{totalsSender?.RequestsAttempts}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        {/* TODO: Add change color (If >85% - green, > 65% - yellow, < 65% - red) */}
                        <span className="opacity-50">{locale.SuccessRate}</span>
                        <span className="font-bold text-yellow-500">{totalsSender?.RequestSuccessRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.AverageTime}</span>
                        <span className="font-bold">{totalsSender?.RequestDuration.AverageMs} {locale.Ms}</span>
                      </div>
                    </>
                  }
                  themeClasses={themeClasses}
                />
            </div>
            <div className="w-[50%] flex flex-col gap-4">
              <MessageBox
                    layout="left"
                    icon={Download}
                    iconColor={amberDesign.iconColor}
                    borderClass={amberDesign.borderClass}
                    iconSize={36}
                    textClass={textClass}
                    >
                    {"start.gg API"}
                </MessageBox>
                <Field
                  variant="mono"
                  value={
                    <>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.LimitRequestPerMinute}</span>
                        <span className="font-bold truncate text-right">{currentGetter?.RequestAttemptsLastMinute}/{limitsTournamentPlatform?.RequestPerMinute}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalSuccessSent}</span>
                        <span className="font-bold truncate text-right text-green-500">{totalsGetter?.RequestSuccess}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.TotalAttemptsSent}</span>
                        <span className="font-bold">{totalsGetter?.RequestsAttempts}</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        {/* TODO: Add change color (If >85% - green, > 65% - yellow, < 65% - red) */}
                        <span className="opacity-50">{locale.SuccessRate}</span>
                        <span className="font-bold text-yellow-500">{totalsGetter?.RequestSuccessRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex text-base justify-between gap-4">
                        <span className="opacity-50">{locale.AverageTime}</span>
                        <span className="font-bold">{totalsGetter?.RequestDuration.AverageMs} {locale.Ms}</span>
                      </div>
                    </>
                  }
                  themeClasses={themeClasses}
                />
            </div>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        locale.Title
      }
      icon={
        Monitor
      }
      iconColor={
        "blue"
      }
      children={content}
      themeClasses={themeClasses}
      layer={layer}
      position="content"

      showCloseButton={false}
      width={"max-w-4xl"}
      headerRight={
          <div className="flex items-center gap-2 text-xs font-semibold">
              <Clock3 size={16} className="text-blue-500" />
              <h2 className="text-sm font-black uppercase italic tracking-tight">
                {snapshotSender?.EstimateRemainingMs === 0
                  ? locale.WaitingCycle
                  : `${locale.TimeRemains} ~${formatDuration(snapshotSender?.EstimateRemainingMs ?? 0, locale)}`
                }
              </h2>
          </div>
      }
    />
  );
};

export default NotificationMonitorModal;
