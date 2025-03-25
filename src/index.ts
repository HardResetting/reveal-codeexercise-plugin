import * as Reveal from "reveal.js";
import "./style.scss"
import { EditableField, Exercise, HtmlExcercise, IValidationRule } from "code-exercises-js"
import ValidationRuleSet from "code-exercises-js/dist/types/Validation";
const merge = require("lodash.merge");

type UnkownExerciseType = Exercise<IValidationRule, ValidationRuleSet<IValidationRule>>;
const supportedLanguages = ["html"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
    supportedLanguages.includes(value as SupportedLanguage);

function createSpoilerElement(innerText: string, index: number): HTMLLIElement {
    const li = document.createElement("li");
    const details = document.createElement("details");
    const summary = document.createElement("summary");

    const openSummaryText = `${index}. Hinweis aufklappen`;
    const closedSummaryText = `${index}. Hinweis zuklappen`;

    summary.textContent = openSummaryText;
    summary.addEventListener("toggle", function () {
        summary.textContent = summary.hasAttribute("[open]") ? closedSummaryText : openSummaryText;
    });

    const spoilerContent = document.createElement("p");
    spoilerContent.textContent = innerText;

    details.appendChild(summary);
    details.appendChild(spoilerContent);
    li.appendChild(details);

    return li;
}

function createHelpTextElement(exercise: UnkownExerciseType): HTMLDivElement {
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
            for (let i = 0; i < data.errors.length; i++) {
                const e = data.errors[i];
                const li = createSpoilerElement(e, i + 1);
                ul.appendChild(li);
            }
            p.replaceChildren(ul);
        }
    });

    return helpTextElement;
}

const removeLeadingNewline = (str: string) => str.replace(/^\n/, "");


type PluginOptions = {
    dataPrefix: string,
    dataSetPrefix: string,
    exerciseType: SupportedLanguage,
    showPreview: string,
    monacoEditorOptions: Record<string, unknown>
}
const defaultOptions: PluginOptions = {
    dataPrefix: "data-code-exercise-",
    dataSetPrefix: "codeExercise",
    exerciseType: "html",
    showPreview: "true",
    monacoEditorOptions: {}
};

type ExtendedOptions = Reveal.Options & { revealCodeExercisePlugin?: Partial<PluginOptions> };
type JsonValue = string | number | boolean | null | JsonObject;
interface JsonObject {
    [key: string]: JsonValue;
}
function isJsonObject(value: unknown): value is JsonObject {
    return !(typeof value !== "object" ||
        value === null ||
        Array.isArray(value));
}

class RevealCodeExercisePlugin implements Reveal.Plugin {
    readonly id: string = "RevealCodeExercisePlugin";
    public options: PluginOptions = defaultOptions;
    private _excercises: Map<string, UnkownExerciseType> = new Map();

    init(reveal: Reveal.Api): void {
        const getConfig = (element: HTMLElement) => {
            const dataset = element.dataset;
            const datasetConfigString = `${this.options.dataSetPrefix}Monaco`;
            const regex = new RegExp(String.raw`^${datasetConfigString}`, "g");

            let config: JsonObject = {};
            if (dataset[datasetConfigString]) {
                try {
                    const parsed = JSON.parse(dataset[datasetConfigString]);

                    if (typeof parsed === "object" && !Array.isArray(parsed)) {
                        config = parsed;
                    }
                } catch (e) {
                    console.warn("Could not parse MonacoEditorOptions!", e);
                }
            }

            for (const key in dataset) {
                if (!key.startsWith(datasetConfigString) || key === datasetConfigString) {
                    continue;
                }

                const path = key
                    .replace(regex, "")
                    .replace(/^[A-Z]/, c => c.toLowerCase())
                    .split(/(?=[A-Z])/)
                    .map(k => k.toLowerCase());

                let objectTail: JsonObject = config;

                for (let i = 0; i < path.length - 1; i++) {
                    const segment = path[i];

                    if (!isJsonObject(objectTail[segment])) {
                        objectTail[segment] = {};
                    }

                    objectTail = objectTail[segment] as JsonObject;
                }

                // Assign final value
                const lastPath = path[path.length - 1];
                objectTail[lastPath] = getDatasetValue(dataset, key);
            }

            return config;
        }
        const getDatasetValue = (dataset: DOMStringMap, key: string): string => {
            if (dataset[key] === undefined) {
                console.warn(`dataset key '${key}' has no value`);
                return "";
            }

            try {
                const obj = JSON.parse(dataset[key]);
                return obj;
            }
            catch {
                return dataset[key];
            }

        }

        const revealOptions = reveal.getConfig() as ExtendedOptions;

        const pluginOptions = revealOptions["revealCodeExercisePlugin"];
        if (pluginOptions != undefined) {
            merge(this.options, pluginOptions);
        }

        const slides = reveal.getSlides();

        const exerciseSlides = slides.filter(slide => slide.dataset[this.options.dataSetPrefix] != undefined)
        for (const slide of exerciseSlides) {

            const monacoEditorOptions = merge(this.options.monacoEditorOptions, getConfig(slide));

            const contentElement = slide.querySelector(`[${this.options.dataPrefix}Content]`);
            const content = removeLeadingNewline(contentElement?.textContent ?? "");

            const exerciseType = slide.dataset[`${this.options.dataSetPrefix}Type`] ?? this.options.exerciseType;
            if (!isSupportedLanguage(exerciseType)) {
                throw `Unsupported exercise type: ${exerciseType}`
            }

            const exerciseId = slide.dataset[`${this.options.dataSetPrefix}Id`];
            const exerciseTitle = slide.dataset[`${this.options.dataSetPrefix}Title`];

            const previewStr = slide.dataset[`${this.options.dataSetPrefix}Preview`] ?? this.options.showPreview;
            const preview = /^true$/i.test(previewStr);

            const customContentElement = slide.querySelector(`[${this.options.dataPrefix}custom-content]`);
            customContentElement?.classList.add("custom-content");

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

            let exercise: UnkownExerciseType;
            switch (exerciseType) {
                case "html":
                    if (preview) {
                        const iframeElement = document.createElement("iframe");
                        exerciseElement.append(iframeElement);
                        exercise = new HtmlExcercise(editorElement, content, iframeElement, monacoEditorOptions);
                    } else {
                        exercise = new HtmlExcercise(editorElement, content, undefined, monacoEditorOptions);
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
            setTimeout(() => exercise.monacoEditorInstance.layout(), 100);
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
    getExercise(id: string): UnkownExerciseType | undefined {
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