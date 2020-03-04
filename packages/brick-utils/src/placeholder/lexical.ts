import {
  LexicalContext,
  LexicalStatus,
  Token,
  TokenType,
  JsonValueType
} from "./interfaces";

export function tokenize(raw: string, symbol = "$"): Token[] {
  const context: LexicalContext = {
    beginPlaceholder: `${symbol}{`,
    raw,
    cursor: 0,
    status: LexicalStatus.Initial,
    tokens: []
  };
  while (context.cursor < raw.length) {
    switch (context.status) {
      case LexicalStatus.Initial:
        eatOptionalRawAndOptionalPlaceholderBegin(context);
        break;
      case LexicalStatus.ExpectField:
        eatWhitespace(context);
        eatField(context);
        break;
      case LexicalStatus.ExpectOptionalBeginDefault:
        eatWhitespace(context);
        eatOptionalDefault(context);
        break;
      case LexicalStatus.ExpectDefaultValue:
        eatWhitespace(context);
        eatDefaultValue(context);
        break;
      case LexicalStatus.ExpectOptionalBeginPipe:
        eatWhitespace(context);
        eatOptionalBeginPipe(context);
        break;
      case LexicalStatus.ExpectPipeIdentifier:
        eatWhitespace(context);
        eatPipeIdentifier(context);
        break;
      case LexicalStatus.ExpectOptionalBeginPipeParameter:
        eatWhitespace(context);
        eatOptionalBeginPipeParameter(context);
        break;
      case LexicalStatus.ExpectPipeParameter:
        eatWhitespace(context);
        eatPipeParameter(context);
        break;
      case LexicalStatus.ExpectPlaceholderEnd:
        eatWhitespace(context);
        eatPlaceholderEnd(context);
        break;
    }
  }
  if (context.status !== LexicalStatus.Initial) {
    throw new Error(`Unexpected final status: ${context.status}`);
  }
  return context.tokens;
}

function eatOptionalRawAndOptionalPlaceholderBegin(
  context: LexicalContext
): void {
  const subRaw = getSubRaw(context);
  const subCursor = subRaw.indexOf(context.beginPlaceholder);
  if (
    subCursor >= 0 &&
    subRaw.charAt(subCursor + context.beginPlaceholder.length) !== "{"
  ) {
    const nextCursor = context.cursor + subCursor;
    if (subCursor > 0) {
      context.tokens.push({
        type: TokenType.Raw,
        value: subRaw.substr(0, subCursor)
      });
    }
    context.tokens.push({
      type: TokenType.BeginPlaceHolder,
      loc: {
        start: nextCursor,
        end: nextCursor + context.beginPlaceholder.length
      }
    });
    context.cursor += subCursor + context.beginPlaceholder.length;
    context.status = LexicalStatus.ExpectField;
  } else {
    context.tokens.push({
      type: TokenType.Raw,
      value: subRaw
    });
    context.cursor = context.raw.length;
  }
}

function eatWhitespace(context: LexicalContext): void {
  context.cursor += getSubRaw(context).match(/^[ \r\n\t]*/)[0].length;
}

function eatField(context: LexicalContext): void {
  // Only allow alphanumeric, `_`, `.`, `*`, `[`, `]`, `-` and other non-ascii.
  const [value] = getSubRaw(context).match(/^[\w.*[\]\-\u{80}-\u{10FFFF}]*/u);
  context.tokens.push({
    type: TokenType.Field,
    value
  });
  context.cursor += value.length;
  context.status = LexicalStatus.ExpectOptionalBeginDefault;
}

function eatOptionalDefault(context: LexicalContext): void {
  if (getSubRaw(context).charAt(0) === "=") {
    context.tokens.push({
      type: TokenType.BeginDefault
    });
    context.cursor += 1;
    context.status = LexicalStatus.ExpectDefaultValue;
  } else {
    context.status = LexicalStatus.ExpectOptionalBeginPipe;
  }
}

function eatDefaultValue(context: LexicalContext): void {
  eatJsonValueOrLiteralString(context, LexicalStatus.ExpectOptionalBeginPipe);
}

function eatOptionalBeginPipe(context: LexicalContext): void {
  if (getSubRaw(context).charAt(0) === "|") {
    context.tokens.push({
      type: TokenType.BeginPipe
    });
    context.cursor += 1;
    context.status = LexicalStatus.ExpectPipeIdentifier;
  } else {
    context.status = LexicalStatus.ExpectPlaceholderEnd;
  }
}

function eatPipeIdentifier(context: LexicalContext): void {
  const matches = getSubRaw(context).match(/^[a-zA-Z]\w*/);
  if (!matches) {
    throw new Error(
      `Expected a pipe identifier at index ${
        context.cursor
      } near: ${JSON.stringify(context.raw.substr(context.cursor))}`
    );
  }
  const value = matches[0];
  context.tokens.push({
    type: TokenType.PipeIdentifier,
    value
  });
  context.cursor += value.length;
  context.status = LexicalStatus.ExpectOptionalBeginPipeParameter;
}

function eatOptionalBeginPipeParameter(context: LexicalContext): void {
  if (getSubRaw(context).charAt(0) === ":") {
    context.tokens.push({
      type: TokenType.BeginPipeParameter
    });
    context.cursor += 1;
    context.status = LexicalStatus.ExpectPipeParameter;
  } else {
    context.status = LexicalStatus.ExpectOptionalBeginPipe;
  }
}

function eatPipeParameter(context: LexicalContext): void {
  eatJsonValueOrLiteralString(
    context,
    LexicalStatus.ExpectOptionalBeginPipeParameter
  );
}

function eatPlaceholderEnd(context: LexicalContext): void {
  if (getSubRaw(context).charAt(0) === "}") {
    context.tokens.push({
      type: TokenType.EndPlaceHolder,
      loc: {
        start: context.cursor,
        end: context.cursor + 1
      }
    });
    context.cursor += 1;
    context.status = LexicalStatus.Initial;
  } else {
    throw new Error(
      `Expected a placeholder end '}' at index ${
        context.cursor
      } near: ${JSON.stringify(context.raw.substr(context.cursor))}`
    );
  }
}

const jsonLiteralMap = new Map([
  ["false", false],
  ["null", null],
  ["true", true]
]);

function eatJsonValueOrLiteralString(
  context: LexicalContext,
  nextStatus: LexicalStatus
): void {
  const subRaw = getSubRaw(context);
  if (/[0-9[{"]/.test(subRaw.charAt(0)) || /-[0-9]/.test(subRaw.substr(0, 2))) {
    eatJsonValue(context, nextStatus);
  } else {
    // Accept any characters except controls and whitespace.
    // Only allow alphanumeric, `_`, `-` and other non-ascii.
    const [value] = getSubRaw(context).match(/^[\w\-\u{80}-\u{10FFFF}]*/u);

    if (jsonLiteralMap.has(value)) {
      context.tokens.push({
        type: TokenType.JsonValue,
        value: jsonLiteralMap.get(value)
      });
    } else {
      context.tokens.push({
        type: TokenType.LiteralString,
        value
      });
    }

    context.cursor += value.length;
    context.status = nextStatus;
  }
}

// 我们不需要非常精确地在一段字符串中匹配出一段*完整合法的* JSON value，
// 而只需要找到一段*可能是完整合法的* JSON value 即可，解析的工作交给 `JSON.parse()`。
// 由于 JSON 中 object/array/string 的镜像起止符特性，我们尝试去完成这些符号匹配即可。
function eatJsonValue(
  context: LexicalContext,
  nextStatus: LexicalStatus
): void {
  const subRaw = getSubRaw(context);
  const firstChar = subRaw.charAt(0);
  const valueType: JsonValueType =
    firstChar === "["
      ? JsonValueType.Array
      : firstChar === "{"
      ? JsonValueType.Object
      : firstChar === '"'
      ? JsonValueType.String
      : JsonValueType.Others;

  let subCursor = 0;
  let objectBracesToMatch = 0;
  let arrayBracketsToMatch = 0;
  let stringQuotesToClose = false;
  let stringBackslashToEscape = false;
  let matched = false;

  while (subCursor < subRaw.length) {
    const char = subRaw.charAt(subCursor);
    if (stringBackslashToEscape) {
      stringBackslashToEscape = false;
    } else if (stringQuotesToClose) {
      if (char === '"') {
        stringQuotesToClose = false;
      } else if (char === "\\") {
        stringBackslashToEscape = true;
      }
    } else {
      switch (char) {
        case "[":
          arrayBracketsToMatch += 1;
          break;
        case "{":
          objectBracesToMatch += 1;
          break;
        case "]":
          arrayBracketsToMatch -= 1;
          break;
        case "}":
          objectBracesToMatch -= 1;
          break;
        case '"':
          stringQuotesToClose = true;
          break;
      }
    }

    subCursor += 1;

    switch (valueType) {
      case JsonValueType.Array:
        matched = !arrayBracketsToMatch;
        break;
      case JsonValueType.Object:
        matched = !objectBracesToMatch;
        break;
      case JsonValueType.String:
        matched = !stringQuotesToClose;
        break;
      default:
        // 对于其它类型，如果下一个字符不再是这些值类型可能的字符时，我们认为 JSON value 完成匹配。
        // 其它可能的值类型：number/boolean/null/undefined。
        matched =
          subCursor < subRaw.length &&
          /[^a-z0-9E.+-]/.test(subRaw.charAt(subCursor));
    }

    if (matched) {
      break;
    }
  }

  if (!matched) {
    throw new Error(
      `Failed to match a JSON value at index ${
        context.cursor
      } near: ${JSON.stringify(context.raw.substr(context.cursor))}`
    );
  }

  context.tokens.push({
    type: TokenType.JsonValue,
    value: JSON.parse(subRaw.substr(0, subCursor))
  });
  context.cursor += subCursor;
  context.status = nextStatus;
}

function getSubRaw(context: LexicalContext): string {
  return context.raw.substr(context.cursor);
}
