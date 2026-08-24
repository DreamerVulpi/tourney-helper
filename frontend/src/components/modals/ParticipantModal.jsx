import React, { useState, useEffect } from "react";
import { Field } from "../ui/Field.jsx";
import { ToggleSwitch } from "../ui/ToggleSwitch.jsx";
import { Modal } from "../modals/Modal.jsx";
import { ValidationModal } from "../ValidationModal.jsx";
import { Log } from "../../../wailsjs/go/application/App.js";
import {
  X,
  Plus,
  UserPlus,
  Save,
  Hash,
  RefreshCcw,
  Edit3,
  User,
  UserKey,
  Locate,
  Languages,
  UserStar,
  MessageCircle,
  Trophy,
  Ban,
} from "lucide-react";

const ParticipantModal = ({
  isOpen,
  onClose,
  onConfirm,
  onSave,
  participantData = null,
  locale,
  activeFilter,
  themeClasses,
  loading = false,
}) => {
  const isEditMode = Boolean(participantData);
  const isEditingBannedPlayer =
    isEditMode &&
    (participantData.isBanned === "banned" ||
      participantData.status === "banned");
  const isBanMode = activeFilter === "banned" && !isEditMode;
  const showBanFields = isBanMode || isEditingBannedPlayer;

  const modalConfig = {
    create: {
      title: locale.Label,
      icon: UserPlus,
      color: "blue",
    },

    edit: {
      title: locale.EditTitle,
      icon: Edit3,
      color: "amber",
    },

    ban: {
      title: locale.AddBanTitle,
      icon: Ban,
      color: "red",
    },

    editBan: {
      title: locale.EditBanTitle,
      icon: Ban,
      color: "red",
    },
  };

  const modalMode = isBanMode
    ? "ban"
    : isEditingBannedPlayer
      ? "editBan"
      : isEditMode
        ? "edit"
        : "create";
  const cfg = modalConfig[modalMode];

  const [formData, setFormData] = useState({
    nickname: "",
    gameId: "",
    region: "Europe",
    locale: "EN",
    rating: 0,
    messenger: { active: false, platform: "Discord", login: "" },
    tournament: { active: false, platform: "Startgg", login: "" },
  });

  const [banData, setBanData] = useState({
    typeBan: "software/cheats",
    reason: "",
    duration: 30,
    unit: "days",
    isPermanent: false,
  });

  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  });

  const banReasons = [
    {
      value: "software/cheats",
      label: locale.AddBanFields.ListViolationCategories.UsingSoftwareOrCheats,
    },
    {
      value: "toxic/insults",
      label: locale.AddBanFields.ListViolationCategories.ToxicBehavior,
    },
    {
      value: "rules/violation",
      label: locale.AddBanFields.ListViolationCategories.ViolationOfRules,
    },
    {
      value: "match/sabotage",
      label: locale.AddBanFields.ListViolationCategories.SabotageMatches,
    },
    {
      value: "smurfing",
      label: locale.AddBanFields.ListViolationCategories.Smurfing,
    },
  ];

  const requiredFields = [
    {
      value: formData.nickname,
      message: locale.AddModalWindow.RequireMsgNickname,
    },
    {
      value: formData.gameId,
      message: locale.AddModalWindow.RequireMsgGameID,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      if (participantData) {
        setFormData({
          nickname:
            participantData.gameNickname || participantData.nickname || "",
          gameId: participantData.gameId || participantData.game_id || "",
          region: participantData.region || "Europe",
          locale: participantData.locale || "EN",
          rating: participantData.rating || 0,
          messenger: {
            active: !!(
              participantData.messengerLogin || participantData.messengerLogin
            ),
            platform: participantData.messengerName || "Discord",
            login:
              participantData.messengerLogin ||
              participantData.messengerLogin ||
              "",
          },
          tournament: {
            active: !!participantData.tournamentPlatformLogin,
            platform: participantData.tournamentPlatformName || "Startgg",
            login: participantData.tournamentPlatformLogin || "",
          },
        });

        const isPlayerBanned =
          participantData.isBanned === "banned" ||
          participantData.status === "banned";
        if (isPlayerBanned) {
          setBanData({
            typeBan:
              participantData.type_ban ||
              participantData.typeBan ||
              "software/cheats",
            reason: participantData.reason || "",
            duration: participantData.duration || 30,
            unit: participantData.unit || "days",
            isPermanent:
              participantData.isPermanent ||
              participantData.expiresAt === null ||
              false,
          });
        }
      } else {
        setFormData({
          nickname: "",
          gameId: "",
          region: "Europe",
          locale: "EN",
          rating: 0,
          messenger: { active: false, platform: "Discord", login: "" },
          tournament: { active: false, platform: "Startgg", login: "" },
        });
        setBanData({
          typeBan: "software/cheats",
          reason: "",
          duration: 30,
          unit: "days",
          isPermanent: false,
        });
      }
    }
  }, [participantData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedNickname = formData.nickname.trim();
    const trimmedGameId = formData.gameId.trim();

    const invalidField = requiredFields.find((field) => !field.value.trim());

    if (invalidField) {
      setValidationAlert({
        isOpen: true,
        message: invalidField.message,
      });
      return;
    }

    if (formData.messenger.active && !formData.messenger.login.trim()) {
      setValidationAlert({
        isOpen: true,
        message: locale.AddModalWindow.ErrActivateMessengerNoLogin,
      });
      return;
    }

    if (formData.tournament.active && !formData.tournament.login.trim()) {
      setValidationAlert({
        isOpen: true,
        message: locale.AddModalWindow.ErrActivateTourneyNoLogin,
      });
      return;
    }

    const isAlreadyBanned =
      participantData &&
      (participantData.isBanned === "banned" ||
        participantData.status === "banned");
    const basePayload = {
      ...formData,
      id: participantData?.id || null,
      nickname: trimmedNickname,
      gameId: trimmedGameId,
      messenger: {
        ...formData.messenger,
        login: formData.messenger.login.trim(),
      },
      tournament: {
        ...formData.tournament,
        login: formData.tournament.login.trim(),
      },
    };

    if (isBanMode || isAlreadyBanned) {
      onSave({
        ...basePayload,
        isDirectBan: isBanMode,
        banInfo: {
          ...banData,
          reason: banData.reason || "No reason",
          duration: banData.isPermanent ? 0 : Number(banData.duration),
        },
      });
    } else {
      onSave(basePayload);
    }
  };

  const footer = (
    <button
      onClick={handleSave}
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
        
        text-white

        ${
          isBanMode || isEditingBannedPlayer
            ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/10"
            : isEditMode
              ? "bg-amber-600 hover:bg-amber-500"
              : "bg-blue-600 hover:bg-blue-500"
        }

        ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
    >
      <Save size={18} />

      {loading
        ? locale.AddModalWindow.ProcessingButtonLabel
        : isBanMode
          ? locale.AddModalWindow.BanAndSaveButtonLabel
          : isEditingBannedPlayer
            ? locale.AddModalWindow.EditBanNoteButtonLabel
            : isEditMode
              ? locale.AddModalWindow.SaveChangesButtonLabel
              : locale.AddModalWindow.CreateNoteButtonLabel}
    </button>
  );

  const labelClasses = `text-[9px] font-black uppercase italic px-1 ${themeClasses.label}'
    }`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        loading={loading}
        title={
          isBanMode
            ? locale.AddBanTitle
            : isEditingBannedPlayer
              ? locale.EditBanTitle
              : isEditMode
                ? locale.EditTitle
                : locale.Label
        }
        icon={
          isBanMode || isEditingBannedPlayer
            ? Ban
            : isEditMode
              ? Edit3
              : UserPlus
        }
        iconColor={
          isBanMode || isEditingBannedPlayer
            ? "red"
            : isEditMode
              ? "amber"
              : "blue"
        }
        variant={isBanMode || isEditingBannedPlayer ? "banned" : "default"}
        themeClasses={themeClasses}
        scrollBarClass={
          isBanMode || isEditingBannedPlayer
            ? "custom-scrollbar-red"
            : isEditMode
              ? "custom-scrollbar-orange"
              : ""
        }
        footer={footer}
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddModalWindow.Nickname}
                icon={User}
                placeholder="Player1"
                value={formData.nickname}
                onChange={(value) =>
                  setFormData({ ...formData, nickname: value })
                }
                themeClasses={themeClasses}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddModalWindow.GameID}
                icon={UserKey}
                placeholder="XXXX-XXXX-XXXX"
                value={formData.gameId}
                onChange={(value) =>
                  setFormData({ ...formData, gameId: value })
                }
                themeClasses={themeClasses}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddModalWindow.Region}
                icon={Locate}
                variant="select"
                value={formData.region}
                onChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
                items={[
                  {
                    label: locale.AddModalWindow.ListRegions.Europe,
                    value: "Europe",
                  },
                  {
                    label: locale.AddModalWindow.ListRegions.Asia,
                    value: "Asia",
                  },
                  {
                    label: locale.AddModalWindow.ListRegions.Africa,
                    value: "Africa",
                  },
                  {
                    label: locale.AddModalWindow.ListRegions.NorthAmerica,
                    value: "NorthAmerica",
                  },
                  {
                    label: locale.AddModalWindow.ListRegions.SouthAmerica,
                    value: "SouthAmerica",
                  },
                  {
                    label: locale.AddModalWindow.ListRegions.Other,
                    value: "Other",
                  },
                ]}
                themeClasses={themeClasses}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Field
                label={locale.AddModalWindow.Language}
                icon={Languages}
                variant="select"
                value={formData.locale}
                onChange={(value) =>
                  setFormData({ ...formData, locale: value })
                }
                items={[
                  {
                    label: "EN",
                    value: "EN",
                  },
                  {
                    label: "RU",
                    value: "RU",
                  },
                ]}
                themeClasses={themeClasses}
              />
            </div>
            <div className="col-span-2">
              <Field
                label={locale.AddModalWindow.Rating}
                icon={UserStar}
                isNumber={true}
                placeholder="100"
                value={formData.rating}
                onChange={(value) =>
                  setFormData({ ...formData, rating: parseInt(value) || 0 })
                }
                themeClasses={themeClasses}
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.messenger.active ? (
              <div
                className={`p-4 rounded-xl border relative ${themeClasses.divider}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className={labelClasses}>
                    {locale.AddModalWindow.ContactOfMessengerLabel}
                  </label>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        messenger: {
                          ...formData.messenger,
                          active: false,
                          login: "",
                        },
                      })
                    }
                    className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    variant="select"
                    icon={MessageCircle}
                    value={formData.messenger.platform}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        messenger: { ...formData.messenger, platform: value },
                      })
                    }
                    items={[
                      {
                        label: "Discord",
                        value: "Discord",
                      },
                    ]}
                    themeClasses={themeClasses}
                  />
                  <Field
                    placeholder="Login"
                    value={formData.messenger.login}
                    icon={User}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        messenger: { ...formData.messenger, login: value },
                      })
                    }
                    themeClasses={themeClasses}
                  />
                </div>
              </div>
            ) : (
              <Field
                labelButton={locale.AddModalWindow.AddContactOfMessenger}
                icon={Plus}
                variant="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    messenger: {
                      ...formData.messenger,
                      active: true,
                      login: "",
                    },
                  })
                }
                themeClasses={themeClasses}
              />
            )}

            {formData.tournament.active ? (
              <div
                className={`p-4 rounded-xl border relative ${themeClasses.divider}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className={labelClasses}>
                    {locale.AddModalWindow.DataOfTourneyPlatformLabel}
                  </label>
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        tournament: {
                          ...formData.tournament,
                          active: false,
                          login: "",
                        },
                      })
                    }
                    className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    variant="select"
                    icon={Trophy}
                    value={formData.tournament.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tournament: { ...formData.tournament, platform: value },
                      })
                    }
                    themeClasses={themeClasses}
                    items={[
                      {
                        label: "Start.gg",
                        value: "Startgg",
                      },
                    ]}
                  />
                  <Field
                    placeholder="Login"
                    icon={User}
                    value={formData.tournament.login}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        tournament: { ...formData.tournament, login: value },
                      })
                    }
                    themeClasses={themeClasses}
                  />
                </div>
              </div>
            ) : (
              <Field
                labelButton={locale.AddModalWindow.AddDataOfTourneyPlatform}
                icon={Plus}
                variant="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    tournament: { ...formData.tournament, active: true },
                  })
                }
                themeClasses={themeClasses}
              />
            )}
          </div>

          {showBanFields && (
            <div
              className={`p-4 rounded-xl border relative ${themeClasses.divider}`}
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 sm:col-span-1">
                  <Field
                    variant="select"
                    label={locale.AddBanFields.ViolationCategoryLabel}
                    value={banData.typeBan}
                    onChange={(value) =>
                      setBanData({ ...banData, typeBan: value })
                    }
                    themeClasses={themeClasses}
                    items={banReasons}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center h-[46px] sm:mt-6">
                  <ToggleSwitch
                    label={locale.AddBanFields.PermanentBanLabel}
                    icon={Ban}
                    checked={banData.isPermanent}
                    color="red"
                    themeClasses={themeClasses}
                    onChange={(value) =>
                      setBanData({ ...banData, isPermanent: value })
                    }
                  />
                </div>

                {!banData.isPermanent && (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <Field
                        label={locale.AddBanFields.ValidityPeriodLabel}
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
                        label={locale.AddBanFields.UnitOfMeasurementLabel}
                        value={banData.unit}
                        variant="select"
                        onChange={(value) =>
                          setBanData({ ...banData, unit: value })
                        }
                        themeClasses={themeClasses}
                        items={[
                          {
                            label:
                              locale.AddBanFields.ListUnitsOfMeasurement.Days,
                            value: "days",
                          },
                          {
                            label:
                              locale.AddBanFields.ListUnitsOfMeasurement.Months,
                            value: "months",
                          },
                        ]}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Field
                    label={locale.AddBanFields.DescriptionViolationLabel}
                    variant="textarea"
                    placeholder={locale.AddBanFields.DescriptionTip}
                    value={banData.reason}
                    onChange={(value) =>
                      setBanData({ ...banData, reason: value })
                    }
                    themeClasses={themeClasses}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <ValidationModal
        isOpen={validationAlert.isOpen}
        onClose={() =>
          setValidationAlert({
            isOpen: false,
            message: "",
          })
        }
        message={validationAlert.message}
        themeClasses={themeClasses}
        locale={locale}
      />
    </>
  );
};

export default ParticipantModal;
