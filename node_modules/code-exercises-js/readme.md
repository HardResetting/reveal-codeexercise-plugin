# CodeExercises.js
A JavaScript library designed to facilitate the creation of coding exercises for students. It integrates with the **Monaco Editor** and provides methods to define validation rules and editable fields for exercises. The library currently only supports **HTML-based exercises** with real-time rendering in an **iframe**.

## 📦 Installation

Include the required scripts in your project:

```html
    <script type="module">
        import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/+esm';
        import { constrainedEditor } from 'https://cdn.jsdelivr.net/gh/Pranomvignesh/constrained-editor-plugin@1.3.0/src/constrainedEditor.js';
        import { HtmlExcercise, EditableField } from "https://cdn.jsdelivr.net/npm/code-exercises-js@1.0.3"

        Object.assign(window, { monaco, constrainedEditor, HtmlExcercise });
    </script>
```

## 🚀 Usage

### 1️⃣ Setup the Editor Container

Create a `div` element to house the **Monaco Editor**:

```html
<div id="container" style="width:800px;height:600px;border:1px solid grey; margin-right: 1rem;"></div>
```

### 2️⃣ Create an HTML Exercise

Instantiate a new `HtmlExercise` object with the **editor container**, **initial content**, and an optional **iframe** for rendering:

```javascript
const editorContainer = document.getElementById("container");
const iframe = document.createElement("iframe");

const htmlExercise = new HtmlExercise(editorContainer, "<html>...</html>", iframe);
```

If no `iframe` is provided, a **hidden one** will be created automatically.

### 3️⃣ Define Validation Rules

You can **chain validation rules** using the provided methods:

```javascript
htmlExercise.addValidationRule()
    .stopOnFail(false) // Continue validating even if a rule fails
    .required() // Ensure content is present
    .not.iframeContains(".style-me", "No '.style-me' element!")
    .contentIncludes("here") // Check if content includes "here"
    .elementIncludesText("body>div", "me") // Ensure a specific element contains text
    .elementHasAttributeColor(".style-me", "background-color", "#f00", null);
```

### 4️⃣ Define Editable Fields

Make specific parts of the exercise **editable** while keeping the rest **read-only**:

```javascript
const styleField = new EditableField([11, 1, 11, 23], true);
styleField.addValidationRule()
    .endsWith("*/", "Need multiline comment!");

const divField = new EditableField([16, 9, 16, 9]);
divField.addValidationRule()
    .required();

htmlExercise.setEditableFields([styleField, divField]);
```

### 5️⃣ Read Validation Results

Listen for validation results using the `onValidate` event:

```javascript
htmlExercise.onValidate.on(data => {
    console.log("Validation results:", data);
});
```

## 📖 Validation Methods

### `HtmlExercise`
- **`.lambda(method: (val: string, iframeDoc: Document) => boolean | Promise<boolean>, message: string): HtmlValidationRuleSet`** - Custom validation logic using a function.
- **`.required(message?: string): HtmlValidationRuleSet`** - Ensures that the content is not empty.
- **`.isValidHTML(message?: string): HtmlValidationRuleSet`** - Validates that the content is well-formed HTML. (Currently using w3c, which might stop working after a few validation attempts)
- **`.stringEquals(compareTo: string, message?: string): HtmlValidationRuleSet`** - Checks if the content matches the given string exactly.
- **`.contentIncludes(searchString: string, message?: string): HtmlValidationRuleSet`** - Ensures the content contains the specified substring.
- **`.iframeContains(selector: string, message?: string): HtmlValidationRuleSet`** - Checks if an element matching the selector exists in the rendered iframe.
- **`.elementHasAttributeColor(selector: string, property: string, color: string, delta?: number, message?: string): HtmlValidationRuleSet`** - Ensures an element has an attribute and its value matches the selected color. The **DeltaE00** algorithm is used to ensure similarity.
- **`.elementIncludesText(selector: string, text: string, message?: string): HtmlValidationRuleSet`** - Checks if an element contains the expected text.
- **`.elementTextMatchesRegex(selector: string, regex: RegExp, message?: string): HtmlValidationRuleSet`** - Validates that the text of an element matches a regular expression.
- **`.stringMatchesRegex(regex: RegExp, message?: string): HtmlValidationRuleSet`** - Ensures the content matches a given regular expression.

### `EditableField`
- **`.lambda(method: (val: string) => boolean, message: string): EditableFieldValidationRuleSet`** - Custom validation logic for editable fields.
- **`.required(message?: string): EditableFieldValidationRuleSet`** - Ensures that the field contains a value.
- **`.equals(compareTo: string, message?: string): EditableFieldValidationRuleSet`** - Checks if the field content matches the specified string.
- **`.startsWith(prefix: string, message?: string): EditableFieldValidationRuleSet`** - Validates that the field content starts with a specific prefix.
- **`.endsWith(suffix: string, message?: string): EditableFieldValidationRuleSet`** - Ensures the field content ends with a given suffix.
- **`.equalsRegex(regex: RegExp, message?: string): EditableFieldValidationRuleSet`** - Checks if the field content matches a regular expression.

## 🛠 Example

```html
<body>
    <div style="display: flex; flex-direction: row;">
        <div id="container" style="width:800px;height:600px;border:1px solid grey; margin-right: 1rem;"></div>
        <iframe id="iframe" style="width:800px;height:600px;border:1px solid grey" frameborder="0"></iframe>
    </div>
    <script type="module">
        import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/+esm';
        import { constrainedEditor } from 'https://cdn.jsdelivr.net/gh/Pranomvignesh/constrained-editor-plugin@1.3.0/src/constrainedEditor.js';
        import { HtmlExcercise, EditableField } from "https://cdn.jsdelivr.net/npm/code-exercises-js@1.0.3"

        Object.assign(window, { monaco, constrainedEditor, HtmlExcercise });

        const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>

    <style>
        .style-me {
            /* here */
        }
    </style>
</head>
<body>
    <div>
        Style me! 
        <br />
        background-color: red;
    </div>
</body>
</html>    
`;

        const element = document.getElementById("container");
        const iframe = document.getElementById("iframe");

        const htmlExcercise = new HtmlExcercise(element, content, iframe);

        htmlExcercise.addValidationRule()
            .required()
            .iframeContains(".style-me", "no '.Style-me'-element!")
            .elementHasAttributeColor(".style-me", "background-color", "#f00", null)
            ;


        const styleField = new EditableField([11, 1, 11, 23], true);
        styleField.addValidationRule
            .required();

        const divField = new EditableField([16, 9, 16, 9]);
        divField.addValidationRule
            .required();

        htmlExcercise.setEditableFields([styleField, divField]);

        htmlExcercise.onValidate.on(data => {
            console.log(data);
        });
    </script>
</body>

</html>
```

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---