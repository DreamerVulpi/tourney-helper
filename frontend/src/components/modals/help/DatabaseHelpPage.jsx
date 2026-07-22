
import { Bug, Database, DatabaseBackup, Helicopter, HelpCircle, HelpCircleIcon, MailQuestion, MessageCircleQuestionMark, Settings } from "lucide-react";
import { Field } from "../../ui/Field.jsx"
import { MessageBox } from "../MessageBox.jsx";
import { QuestionAnswerBox } from "./QuestionAnswerBox.jsx"
import { OpenURL } from "../../../../wailsjs/go/application/App.js";

export function DatabaseHelpPage(locale, themeClasses) {
    const blueDesign = {
        iconColor: "text-blue-500",
        borderClass: "border-blue-500/20 bg-blue-500/10",
    }
    const amberDesign = {
        iconColor: "text-amber-500",
        borderClass: "border-amber-500/20 bg-amber-500/10",
    }


    const whatIsDatabase = QuestionAnswerBox(
        {
            icon: Database,
            iconColor: blueDesign.iconColor,
            borderClass: blueDesign.borderClass,
            question: locale.WhatIsDatabase.Question,
            answer: locale.WhatIsDatabase.Answer,
            themeClasses: themeClasses
        }
    )
    
    const partsAnswerHU = locale.HowUse.Answer.split("%v")
    const howUse = QuestionAnswerBox(
        {
            icon: MessageCircleQuestionMark,
            iconColor: amberDesign.iconColor,
            borderClass: amberDesign.borderClass,
            question: locale.HowUse.Question,
             answer: <>
                {partsAnswerHU[0]}
                <span
                    className="text-red-500 text-bold underline"
                >
                    {partsAnswerHU[1]}
                </span>
            </>,
            themeClasses: themeClasses
        }
    )

    return (
        <div className="flex gap-4">
            <div className="w-[50%] flex flex-col gap-4">
                {whatIsDatabase}
            </div>

            <div className="w-[50%] flex flex-col gap-4">
                {howUse}
            </div>
        </div>
    )
}

export default DatabaseHelpPage;