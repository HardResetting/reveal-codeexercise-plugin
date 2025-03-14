import * as Reveal from "reveal.js";
import "./style.scss"
import { EditableField, Exercise, HtmlExcercise, IValidationRule } from "code-exercises-js"
import ValidationRuleSet from "code-exercises-js/dist/types/Validation";

type unkownExerciseType = Exercise<IValidationRule, ValidationRuleSet<IValidationRule>>;
const supportedLanguages = ["html"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
    supportedLanguages.includes(value as SupportedLanguage);

function createSpoilerElement(innerText: string): HTMLLIElement {
    const li = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Hinweis umschalten";

    const spoilerContent = document.createElement("p");
    spoilerContent.textContent = innerText;

    details.appendChild(summary);
    details.appendChild(spoilerContent);
    li.appendChild(details);

    return li;
}

function createHelpTextElement(exercise: unkownExerciseType): HTMLDivElement {
    const helpTextElement = document.createElement("div");
    helpTextElement.classList.add("spoiler-element");

    const h4 = document.createElement("h4");
    h4.innerText = "Tipps zur Bearbeitung:";

    const p = document.createElement("p");
    p.innerText = "Beginnen Sie mit der Aufgabe!";

    const count = document.createElement("span");
    count.classList.add("sr-only");
    count.setAttribute("aria-live", "polite");
    count.innerText = "Es gibt noch keine Hinweise.";

    helpTextElement.append(h4, p, count);

    exercise.onValidate.on(data => {
        count.innerText = `Es gibt ${data.errors.length} Hinweise.`;

        if (data.valid) {
            p.replaceChildren("Gut gemacht! Alles richtig!");
        } else {
            const ul = document.createElement("ul");
            data.errors.forEach(e => {
                const li = createSpoilerElement(e);
                ul.appendChild(li);
            });
            p.replaceChildren(ul);
        }
    });

    return helpTextElement;
}

const removeLeadingNewline = (str: string) => str.replace(/^\n/, "");

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
            const content = removeLeadingNewline(contentElement?.textContent ?? "");

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

            const helpTextElement = createHelpTextElement(exercise);
            exerciseElement.append(helpTextElement);

            if (exerciseId != undefined) {
                this._excercises.set(exerciseId, exercise);
            }

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

    /**
    * Returns the Exercises with that id or undefined
    * @param string The id of the Exercise
    * @returns The Exercise object
    *
    */
    getExercise(id: string): unkownExerciseType | undefined {
        return this._excercises.get(id);
    }

    /**
    * Uses the EditableField constructor to create a new instance of EditableField
    * @param range Sets the range for the field [lineStart, charStart, lineEnd, charEnd]
    * @param allowMultiline Sets the flag to allow newLine characters as input
    * @returns EditableField
    *
    */
    createEditableField(range: [number, number, number, number], allowMultiline?: boolean) {
        return new EditableField(range, allowMultiline);
    }
}

export default () => new RevealCodeExercisePlugin();