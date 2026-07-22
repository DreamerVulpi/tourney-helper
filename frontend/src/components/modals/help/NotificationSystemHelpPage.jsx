
import { Bug, FileQuestionMark, MailQuestion, Settings, TextSearch, UserCog, UserPen } from "lucide-react";
import { Field } from "../../ui/Field.jsx"
import { MessageBox } from "../MessageBox.jsx";
import { QuestionAnswerBox } from "./QuestionAnswerBox.jsx"
import { OpenURL } from "../../../../wailsjs/go/application/App.js";

export function NotificationSystemHelpPage(locale, themeClasses) {
    const blueDesign = {
        iconColor: "text-blue-500",
        borderClass: "border-blue-500/20 bg-blue-500/10",
    }
    const amberDesign = {
        iconColor: "text-amber-500",
        borderClass: "border-amber-500/20 bg-amber-500/10",
    }

    const howIsWorks = QuestionAnswerBox(
        {
            icon: Settings,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.HowIsWorks.Question,
            answer: locale.HowIsWorks.Answer,
            themeClasses: themeClasses
        }
    )
    const whatIsDebugMode = QuestionAnswerBox(
        {
            icon: Bug,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.WhatIsDebugMode.Question,
            answer: locale.WhatIsDebugMode.Answer,
            themeClasses: themeClasses
        }
    )

    const howGetDataForStartgg = QuestionAnswerBox(
        {
            icon: TextSearch,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
            question: locale.HowGetDataForStartgg.Question,
            answer: locale.HowGetDataForStartgg.Answer,
            themeClasses: themeClasses
        }
    )

    const partsAnswerHGDFD = locale.HowGetDataForDiscord.Answer.split("%v")
    const howGetDataForDiscord = QuestionAnswerBox(
        {
            icon: TextSearch,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
            question: locale.HowGetDataForDiscord.Question,
            answer: <>
                {partsAnswerHGDFD[0]}
                <span
                    className="text-blue-500 underline cursor-pointer hover:text-blue-400"
                    onClick={() => {
                        OpenURL("https://discord.com/developers/applications")
                    }}
                >
                    {partsAnswerHGDFD[1]}
                </span>
                {partsAnswerHGDFD[2]}
            </>,
            themeClasses: themeClasses
        }
    )

    const initialSetupQA = QuestionAnswerBox(
        {
            icon: MailQuestion,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
            question: locale.InitialSetup.Question,
            answer: locale.InitialSetup.Answer,
            themeClasses: themeClasses
        }
    )

    const partsAnswerWCD = locale.WhatCanDo.Answer.split("%v")
    const whatCanDo = QuestionAnswerBox(
        {
            icon: UserPen,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.WhatCanDo.Question,
            answer: 
            <>
                {partsAnswerWCD[0]}
                <span
                    className="text-blue-500"
                >
                    {partsAnswerWCD[1]}
                </span>
                {partsAnswerWCD[2]}
                {partsAnswerWCD[3]}
            </>,
            themeClasses: themeClasses,
        }
    )

    const usuallyUse = QuestionAnswerBox(
        {
            icon: UserCog,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
            question: locale.UsuallyUsing.Question,
            answer: locale.UsuallyUsing.Answer,
            themeClasses: themeClasses
        }
    )

    return (
        <div className="flex gap-4">
            <div className="w-[50%] flex flex-col gap-4">
                {howIsWorks}
                {whatCanDo}
                {whatIsDebugMode}
            </div>

            <div className="w-[50%] flex flex-col gap-4">
                {initialSetupQA}
                {usuallyUse}
                {howGetDataForStartgg}
                {howGetDataForDiscord}
            </div>
        </div>
    )
}

export default NotificationSystemHelpPage;