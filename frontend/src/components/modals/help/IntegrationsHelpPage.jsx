
import { MailQuestion, Settings, TextSearch } from "lucide-react";
import { QuestionAnswerBox } from "./QuestionAnswerBox.jsx"

export function IntegrationsHelpPage(locale, themeClasses) {
    const blueDesign = {
        iconColor: "text-blue-500",
        borderClass: "border-blue-500/20 bg-blue-500/10",
    }
    const amberDesign = {
        iconColor: "text-amber-500",
        borderClass: "border-amber-500/20 bg-amber-500/10",
    }

    const whatIsThis = QuestionAnswerBox(
        {
            icon: Settings,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.WhatIsThis.Question,
            answer: locale.WhatIsThis.Answer,
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

    const initialSetup = QuestionAnswerBox(
        {
            icon: MailQuestion,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.InitialSetup.Question,
            answer: locale.InitialSetup.Answer,
            themeClasses: themeClasses
        }
    )
    
    return (
        <div className="flex gap-4">
            <div className="w-[50%] flex flex-col gap-4">
                {whatIsThis}
                {initialSetup}
            </div>

            <div className="w-[50%] flex flex-col gap-4">
                {howGetDataForStartgg}
                {howGetDataForDiscord}
            </div>
        </div>
    )
}

export default IntegrationsHelpPage;