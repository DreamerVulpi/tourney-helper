import { Field } from "../../ui/Field.jsx";
import { ToggleSwitch } from "../../ui/ToggleSwitch.jsx";

export function ParticipantBanContent({
    locale,
    themeClasses,

    banReasons,

    typeBan,
    setTypeBan,

    reason,
    setReason,

    duration,
    setDuration,

    unit,
    setUnit,

    isPermanent,
    setIsPermanent,
}) {
    return (
        <div className="p-6 space-y-5">

            <Field
                type="select"
                label={locale.BanCategoryLabel}
                value={typeBan}
                items={banReasons}
                onChange={setTypeBan}
                themeClasses={themeClasses}
            />

            <Field
                label={locale.ReasonLabel}
                value={reason}
                onChange={setReason}
                placeholder={locale.ReasonPlaceholder}
                themeClasses={themeClasses}
            />

            <ToggleSwitch
                label={locale.PermanentBanLabel}
                checked={isPermanent}
                onChange={setIsPermanent}
                themeClasses={themeClasses}
            />

            {!isPermanent && (
                <div className="flex gap-3">

                    <Field
                        width="120px"
                        type="number"
                        label={locale.DurationLabel}
                        value={duration}
                        onChange={setDuration}
                        themeClasses={themeClasses}
                    />

                    <Field
                        width="150px"
                        type="select"
                        label={locale.UnitLabel}
                        value={unit}
                        onChange={setUnit}
                        themeClasses={themeClasses}
                        items={[
                            {
                                value: "hours",
                                label: locale.HoursLabel,
                            },
                            {
                                value: "days",
                                label: locale.DaysLabel,
                            },
                            {
                                value: "weeks",
                                label: locale.WeeksLabel,
                            },
                            {
                                value: "months",
                                label: locale.MonthsLabel,
                            },
                        ]}
                    />

                </div>
            )}

        </div>
    );
}