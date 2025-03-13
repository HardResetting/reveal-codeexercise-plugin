import * as Reveal from "reveal.js";
import "./style.scss"
import { Exercise, HtmlExcercise, IValidationRule } from "code-exercises-js"
import ValidationRuleSet from "code-exercises-js/dist/types/Validation";

type unkownExerciseType = Exercise<IValidationRule, ValidationRuleSet<IValidationRule>>;
const supportedLanguages = ["html"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
    supportedLanguages.includes(value as SupportedLanguage);

class RevealCodeExercisePlugin implements Reveal.Plugin {
    readonly id: string = "RevealCodeExercisePlugin";
    dataPrefix = "data-code-exercise-";
    dataSetPrefix = "codeExercise";
    defaultExerciseType: SupportedLanguage = "html";
    defaultShowPreview = "true";

    private _excercises: Map<string, unkownExerciseType> = new Map();

    init(reveal: Reveal.Api): void | Promise<any> {
        const slides = reveal.getSlides();

        const exerciseSlides = slides.filter(slide => slide.dataset[this.dataSetPrefix] != undefined)
        for (const slide of exerciseSlides) {

            const contentElement = slide.querySelector(`[${this.dataPrefix}Content]`);
            const content = contentElement?.textContent ?? "";

            const exerciseType = slide.dataset[`${this.dataSetPrefix}Type`] ?? this.defaultExerciseType;
            if (!isSupportedLanguage(exerciseType)) {
                throw `Unsupported exercise type: ${exerciseType}`
            }

            const exerciseId = slide.dataset[`${this.dataSetPrefix}Id`];
            const exerciseTitle = slide.dataset[`${this.dataSetPrefix}Title`];

            const previewStr = slide.dataset[`${this.dataSetPrefix}Preview`] ?? this.defaultShowPreview;
            const preview = /^true$/i.test(previewStr);

            const customContentElement = slide.querySelector(`[${this.dataPrefix}custom-content]`);

            const exerciseElement = document.createElement("div");
            exerciseElement.classList.add("code-exercise");
            slide.replaceChildren(exerciseElement);

            if (exerciseTitle != undefined) {
                const titleElement = document.createElement("h3");
                titleElement.textContent = exerciseTitle
                exerciseElement.append(titleElement);
            }

            const editorElement = document.createElement("div");
            editorElement.classList.add("monaco-editor-container");
            exerciseElement.append(editorElement);

            let exercise: unkownExerciseType;
            switch (exerciseType) {
                case "html":
                    if (preview) {
                        const iframeElement = document.createElement("iframe");
                        exerciseElement.append(iframeElement);
                        exercise = new HtmlExcercise(editorElement, content, iframeElement);
                    } else {
                        exercise = new HtmlExcercise(editorElement, content);
                    }

                    break;
                default:
                    throw "Unreachable";
            }

            const helpTextElement = document.createElement("p");
            exercise.onValidate.on(data => {
                if (data.valid) {
                    helpTextElement.replaceChildren("Gut gemacht! Alles richtig!");
                } else {
                    helpTextElement.replaceChildren("Hier ein paar Tipps:")
                    const ul = document.createElement("ul");
                    ul.classList.add("spoiler-list");
                    data.errors.forEach(e => {
                        const li = document.createElement("li");
                        li.textContent = e;
                        ul.appendChild(li);
                    });
                    helpTextElement.appendChild(ul);
                }
            });

            if (exerciseId != undefined) {
                this._excercises.set(exerciseId, exercise);
            }

            exerciseElement.append(helpTextElement);

            if (customContentElement != null) {
                exerciseElement.append(customContentElement);
            }

            // TODO: realy annoying bug. I think it is because monaco does not know the size of its parent at this point in time.
            setTimeout(() => (exercise as any)._monacoEditorInstance._editorInstance.layout(), 100);
        }
    }
    destroy(): void {
        throw new Error("Method not implemented.");
    }

    onSlideChanged(event: Event): void {
        console.log(event);
    }

    getExercise(id: string): unkownExerciseType | undefined {
        return this._excercises.get(id);
    }
}

export default () => new RevealCodeExercisePlugin();