import React, { useState, useEffect, useMemo } from "react";
import {
  Ban,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Save,
} from "lucide-react";

import { Modal } from "./Modal.jsx";
import { MessageBox } from "./MessageBox.jsx";
import { Field } from "../ui/Field.jsx";
import { ToggleSwitch } from "../ui/ToggleSwitch.jsx";

const ParticipantActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  participantData,
  currentGame,
  loading = false,
  locale,
  theme,
  themeClasses,
}) => {
  const isDark = theme === "dark";
  const banReasons = useMemo(
    () => [
      {
        value: "software/cheats",
        label:
          locale.AddButton.AddBanFields.ListViolationCategories
            .UsingSoftwareOrCheats,
      },
      {
        value: "toxic/insults",
        label:
          locale.AddButton.AddBanFields.ListViolationCategories.ToxicBehavior,
      },
      {
        value: "rules/violation",
        label:
          locale.AddButton.AddBanFields.ListViolationCategories
            .ViolationOfRules,
      },
      {
        value: "match/sabotage",
        label:
          locale.AddButton.AddBanFields.ListViolationCategories.SabotageMatches,
      },
      {
        value: "smurfing",
        label: locale.AddButton.AddBanFields.ListViolationCategories.Smurfing,
      },
    ],
    [locale],
  );

  const [banData, setBanData] = useState({
    typeBan: "software/cheats",
    reason: "",
    duration: 30,
    unit: "days",
    isPermanent: false,
  });

  const [typeBan, setTypeBan] = useState(banReasons[0].value);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("1");
  const [unit, setUnit] = useState("days");
  const [isPermanent, setIsPermanent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTypeBan(banReasons[0].value);
    setReason("");
    setDuration("1");
    setUnit("days");
    setIsPermanent(false);
  }, [isOpen, actionType]);

  if (!isOpen || (!participantData && actionType !== "reset_rating_all")) {
    return null;
  }

  const actionConfig = {
    ban: {
      title: locale.AddButton.BanTitle,
      icon: Ban,
      iconColor: "red",
      iconColor2: "text-red-500",
      borderClass: isDark
        ? "bg-red-500/10 border-red-500/20"
        : "bg-red-50 border-red-200",
      btnBg: "bg-red-600 hover:bg-red-500",
      btnText: locale.AddButton.BanButtonLabel,
      confirmIcon: <Ban size={18} />,
      hasPadding: false,
    },
    unban: {
      title: locale.AddButton.UnbanTitle,
      icon: ShieldCheck,
      iconColor: "green",
      iconColor2: "text-green-500",
      borderClass: isDark
        ? "bg-green-500/5 border-green-500/10"
        : "bg-green-800/[0.02] border-green-100",
      textClass: isDark ? "text-slate-300" : "text-slate-600",
      btnBg: "bg-green-600 hover:bg-green-500",
      btnText: locale.AddButton.UnbanButtonLabel,
      confirmIcon: <ShieldCheck size={18} />,
      hasPadding: true,
    },

    delete: {
      title: locale.AddButton.DeleteTitle,
      icon: Trash2,
      iconColor: "red",
      iconColor2: "text-red-500",
      borderClass: isDark
        ? "bg-rose-500/10 border-rose-500/20"
        : "bg-rose-50 border-rose-200",
      textClass: isDark ? "text-slate-300" : "text-slate-600",
      btnBg: "bg-rose-600 hover:bg-rose-500",
      btnText: locale.AddButton.DeleteButtonLabel,
      confirmIcon: <Trash2 size={18} />,
      hasPadding: true,
    },

    reset_rating_all: {
      title: locale.AddButton.ResetRatingTitle,
      icon: AlertTriangle,
      iconColor: "red",
      iconColor2: "text-red-500",
      borderClass: isDark
        ? "bg-red-500/10 border-red-500/20"
        : "bg-red-50 border-red-200",
      textClass: isDark ? "text-slate-300" : "text-slate-600",
      btnBg: "bg-red-600 hover:bg-red-500",
      btnText: locale.AddButton.ResetRatingButtonLabel,
      confirmIcon: <RotateCcw size={18} />,
      hasPadding: true,
    },
  }[actionType];

  if (!actionConfig) {
    return null;
  }

  const handleConfirm = () => {
    if (actionType === "ban") {
      if (!isPermanent && (!duration || Number(duration) <= 0)) {
        console.error(locale.AddButton.ConfirmDurationBan);
        return;
      }

      onConfirm({
        action: "ban",
        id: participantData.id,
        typeBan: banData.typeBan,
        reason: banData.reason,
        isPermanent: banData.isPermanent,
        duration: isPermanent ? 0 : parseInt(banData.duration),
        unit: banData.isPermanent ? "infinite" : banData.unit,
      });

      return;
    }

    onConfirm({
      action: actionType,
    });
  };

  const footer = (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className={`
        w-full
        flex
        items-center
        justify-center
        gap-3
        h-[56px]
        rounded-xl
        font-black
        uppercase
        italic
        tracking-wider
        transition-all
        text-white

        ${actionConfig.btnBg}

        ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
    >
      {actionConfig.confirmIcon}

      {actionConfig.btnText}
    </button>
  );

  const ResetRatingButtonMsgParts =
    locale.ResetRatingButton.Message.split("%v");
  const DeleteMsgParts = locale.AddButton.DeleteMsg.split("%v");
  const UnbanMsgParts = locale.AddButton.UnbanMsg.split("%v");

  const modalTitle = (
    <>
      {actionConfig.title}{" "}
      <span className={`${actionConfig.iconColor2} font-black italic`}>
        {participantData?.nickname}
      </span>
    </>
  );

  const banPlayerFields = (
    <div
      className={`p-6 max-h-[70vh] overflow-y-auto space-y-4 ${themeClasses.divider}`}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <Field
            variant="select"
            label={locale.AddButton.AddBanFields.ViolationCategoryLabel}
            value={banData.typeBan}
            onChange={(value) => setBanData({ ...banData, typeBan: value })}
            themeClasses={themeClasses}
            items={banReasons}
          />
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center h-[46px] sm:mt-6">
          <ToggleSwitch
            label={locale.AddButton.AddBanFields.PermanentBanLabel}
            icon={Ban}
            checked={banData.isPermanent}
            color="red"
            themeClasses={themeClasses}
            onChange={(value) => setBanData({ ...banData, isPermanent: value })}
          />
        </div>

        {!banData.isPermanent && (
          <>
            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddButton.AddBanFields.ValidityPeriodLabel}
                value={banData.duration}
                isNumber={true}
                onChange={(value) =>
                  setBanData({
                    ...banData,
                    duration: parseInt(value) || 1,
                  })
                }
                themeClasses={themeClasses}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddButton.AddBanFields.UnitOfMeasurementLabel}
                value={banData.unit}
                variant="select"
                onChange={(value) => setBanData({ ...banData, unit: value })}
                themeClasses={themeClasses}
                items={[
                  {
                    label:
                      locale.AddButton.AddBanFields.ListUnitsOfMeasurement.Days,
                    value: "days",
                  },
                  {
                    label:
                      locale.AddButton.AddBanFields.ListUnitsOfMeasurement
                        .Months,
                    value: "months",
                  },
                ]}
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <Field
            label={locale.AddButton.AddBanFields.DescriptionViolationLabel}
            variant="textarea"
            placeholder={locale.AddButton.AddBanFields.DescriptionTip}
            value={banData.reason}
            onChange={(value) => setBanData({ ...banData, reason: value })}
            themeClasses={themeClasses}
          />
        </div>
      </div>
    </div>
  );

  const messages = {
    reset_rating_all: (
      <>
        {ResetRatingButtonMsgParts[0]}
        <span className="text-red-500 font-black italic">
          {ResetRatingButtonMsgParts[1]}
        </span>
        {ResetRatingButtonMsgParts[2]}
      </>
    ),

    delete: (
      <>
        {DeleteMsgParts[0]}
        <span className="text-rose-500 font-black italic">
          {participantData?.nickname}
        </span>
        {DeleteMsgParts[1]}
      </>
    ),

    unban: (
      <>
        {UnbanMsgParts[0]}
        <span className="text-green-500 font-black italic">
          {participantData?.nickname}
        </span>
        {UnbanMsgParts[1]}
      </>
    ),
  };

  const msgBox = (
    <MessageBox
      icon={actionConfig.icon}
      iconColor={actionConfig.iconColor2}
      borderClass={actionConfig.borderClass}
      textClass={actionConfig.textClass}
    >
      {actionType === "reset_rating_all" && (
        <>
          {ResetRatingButtonMsgParts[0]}{" "}
          <span className="text-red-500 font-black italic">
            {ResetRatingButtonMsgParts[1]}
          </span>{" "}
          {ResetRatingButtonMsgParts[2]}{" "}
          <span className="text-red-500 font-black italic">{currentGame}</span>{" "}
          {ResetRatingButtonMsgParts[3]}
        </>
      )}

      {actionType === "delete" && (
        <>
          {DeleteMsgParts[0]}{" "}
          <span className="text-rose-500 font-black italic">
            {participantData?.nickname}
          </span>{" "}
          {DeleteMsgParts[1]}
        </>
      )}

      {actionType === "unban" && (
        <>
          {UnbanMsgParts[0]}{" "}
          <span className="text-green-500 font-black italic">
            {participantData?.nickname}
          </span>{" "}
          {UnbanMsgParts[1]}
        </>
      )}
    </MessageBox>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={actionConfig.icon}
      iconColor={actionConfig.iconColor}
      themeClasses={themeClasses}
      footer={footer}
    >
      <div className={actionConfig.hasPadding ? "p-8" : ""}>
        {actionType === "ban" ? banPlayerFields : msgBox}
      </div>
    </Modal>
  );
};

export default ParticipantActionModal;
