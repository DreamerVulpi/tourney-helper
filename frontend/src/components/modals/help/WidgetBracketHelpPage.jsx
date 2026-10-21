
import { Settings, UserCog } from "lucide-react";
import { QuestionAnswerBox } from "./QuestionAnswerBox.jsx"

export function WidgetBracketHelpPage(locale, themeClasses) {
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
    
    
    const partsAnswerWCD = locale.WhatCanDo.Answer.split("%v")
    const whatCanDo = QuestionAnswerBox(
        {
            icon: UserCog,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
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

  

    return (
        <div className="flex gap-4">
            <div className="w-[50%] flex flex-col gap-4">
                {howIsWorks}
            </div>

            <div className="w-[50%] flex flex-col gap-4">
                {whatCanDo}
            </div>
        </div>
    )
}

export default WidgetBracketHelpPage;