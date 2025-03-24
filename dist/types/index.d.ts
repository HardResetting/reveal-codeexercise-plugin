import * as Reveal from "reveal.js";
import "./style.scss";
import { EditableField, Exercise, IValidationRule } from "code-exercises-js";
import ValidationRuleSet from "code-exercises-js/dist/types/Validation";
type UnkownExerciseType = Exercise<IValidationRule, ValidationRuleSet<IValidationRule>>;
declare const supportedLanguages: readonly ["html"];
type SupportedLanguage = (typeof supportedLanguages)[number];
type PluginOptions = {
    dataPrefix: string;
    dataSetPrefix: string;
    exerciseType: SupportedLanguage;
    showPreview: string;
    monacoEditorOptions: Record<string, unknown>;
};
declare class RevealCodeExercisePlugin implements Reveal.Plugin {
    readonly id: string;
    options: PluginOptions;
    private _excercises;
    init(reveal: Reveal.Api): void;
    destroy(): void;
    /**
    * Returns the Exercises with that id or undefined
    * @param string The id of the Exercise
    * @returns The Exercise object
    *
    */
    getExercise(id: string): UnkownExerciseType | undefined;
    /**
    * Uses the EditableField constructor to create a new instance of EditableField
    * @param range Sets the range for the field [lineStart, charStart, lineEnd, charEnd]
    * @param allowMultiline Sets the flag to allow newLine characters as input
    * @returns EditableField
    *
    */
    createEditableField(range: [number, number, number, number], allowMultiline?: boolean): EditableField;
}
declare const _default: () => RevealCodeExercisePlugin;
export default _default;
