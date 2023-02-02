import { PipeCall } from "@next-core/pipes";
import { tokenize } from "./lexical.js";
import {
  Token,
  TokenType,
  InjectableString,
  Placeholder,
} from "./interfaces.js";

export function parseInjectableString(
  raw: string,
  symbols: string | string[]
): InjectableString {
  return parseTokens(tokenize(raw, symbols));
}

function parseTokens(tokens: Token[]): InjectableString {
  const tree: InjectableString = {
    type: "InjectableString",
    elements: [],
  };

  let token: Token | undefined;

  function optionalToken(type: TokenType): boolean {
    if (type === tokens[0].type) {
      token = tokens.shift();
      return true;
    }
    return false;
  }

  function acceptToken(type: TokenType | TokenType[]): void {
    token = tokens.shift() as Token;
    if (
      Array.isArray(type) ? !type.includes(token.type) : type !== token.type
    ) {
      throw new Error(`Expected token: ${type}, received token: ${token.type}`);
    }
  }

  while (tokens.length > 0) {
    if (optionalToken(TokenType.Raw)) {
      tree.elements.push({
        type: "RawString",
        value: token.value,
      });
    } else {
      acceptToken(TokenType.BeginPlaceHolder);
      const start = token.loc.start;
      const symbol = token.value;
      acceptToken(TokenType.Field);

      const placeholder: Placeholder = {
        type: "Placeholder",
        symbol,
        field: token.value,
        defaultValue: undefined,
        pipes: [],
        loc: {
          start,
          end: start,
        },
      };
      tree.elements.push(placeholder);

      if (optionalToken(TokenType.BeginDefault)) {
        acceptToken([TokenType.JsonValue, TokenType.LiteralString]);
        placeholder.defaultValue = token.value;
      }

      while (optionalToken(TokenType.BeginPipe)) {
        acceptToken(TokenType.PipeIdentifier);
        const pipe: PipeCall = {
          type: "PipeCall",
          identifier: token.value,
          parameters: [],
        };
        placeholder.pipes.push(pipe);

        while (optionalToken(TokenType.BeginPipeParameter)) {
          acceptToken([TokenType.JsonValue, TokenType.LiteralString]);
          pipe.parameters.push(token.value);
        }
      }

      acceptToken(TokenType.EndPlaceHolder);
      placeholder.loc.end = token.loc.end;
    }
  }

  return tree;
}
