import * as Reveal from "reveal.js";
import "./style.scss";
import { Exercise, IValidationRule } from "code-exercises-js";
import ValidationRuleSet from "code-exercises-js/dist/types/Validation";
type unkownExerciseType = Exercise<IValidationRule, ValidationRuleSet<IValidationRule>>;
declare const supportedLanguages: readonly ["html"];
type SupportedLanguage = (typeof supportedLanguages)[number];
declare class RevealCodeExercisePlugin implements Reveal.Plugin {
    readonly id: string;
    dataPrefix: string;
    dataSetPrefix: string;
    defaultExerciseType: SupportedLanguage;
    defaultShowPreview: string;
    private _excercises;
    init(reveal: Reveal.Api): void | Promise<any>;
    destroy(): void;
    onSlideChanged(event: Event): void;
    getExercise(id: string): unkownExerciseType | undefined;
}
declare const _default: () => RevealCodeExercisePlugin;
export default _default;
