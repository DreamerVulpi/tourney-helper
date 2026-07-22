import { MessageBox } from "../MessageBox.jsx";
import { Field } from "../../ui/Field.jsx"

export function QuestionAnswerBox({
    icon,
    iconColor,
    borderClass,
    question,
    textClass = "text-base uppercase font-bold italic",
    answerClass = "text-base",
    answer,
    themeClasses,
    iconSize = 36,
}) {
    return (
        <div className="flex flex-col gap-4">
            <MessageBox
                layout="left"
                icon={icon}
                iconColor={iconColor}
                borderClass={borderClass}
                textClass={textClass}
                iconSize={iconSize}
            >
                {question}
            </MessageBox>

            <Field
                variant="mono"
                value={
                    <div className={`text-center whitespace-pre-line ${answerClass}`}>
                        {answer}
                    </div>
                }
                themeClasses={themeClasses}
            />
        </div>
    );
}

export default QuestionAnswerBox;