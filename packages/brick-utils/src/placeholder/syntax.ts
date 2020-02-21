import { tokenize } from "./lexical";
import {
  Token,
  TokenType,
  InjectableString,
  Placeholder,
  PipeCall
} from "./interfaces";

export function parseInjectableString(
  raw: string,
  symbol = "$"
): InjectableString {
  return parseTokens(tokenize(raw, symbol));
}

function parseTokens(tokens: Token[]): InjectableString {
  const tree: InjectableString = {
    type: "InjectableString",
    elements: []
  };

  let token: Token;

  function optionalToken(type: TokenType): boolean {
    if (type === tokens[0].type) {
      token = tokens.shift();
      return true;
    }
    return false;
  }

  function acceptToken(type: TokenType | TokenType[]): void {
    token = tokens.shift();
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
        value: token.value
      });
    } else {
      acceptToken(TokenType.BeginPlaceHolder);
      const start = token.loc.start;
      acceptToken(TokenType.Field);

      const placeholder: Placeholder = {
        type: "Placeholder",
        field: token.value,
        defaultValue: undefined,
        pipes: [],
        loc: {
          start,
          end: start
        }
      };
      tree.elements.push(placeholder);

      if (optionalToken(TokenType.BeginDefault)) {
        acceptToken([TokenType.LegacyLiteral, TokenType.JsonValue]);
        placeholder.defaultValue = token.value;
      }

      while (optionalToken(TokenType.BeginPipe)) {
        acceptToken(TokenType.PipeIdentifier);
        const pipe: PipeCall = {
          type: "PipeCall",
          identifier: token.value,
          parameters: []
        };
        placeholder.pipes.push(pipe);

        while (optionalToken(TokenType.BeginPipeParameter)) {
          acceptToken(TokenType.JsonValue);
          pipe.parameters.push(token.value);
        }
      }

      acceptToken(TokenType.EndPlaceHolder);
      placeholder.loc.end = token.loc.end;
    }
  }

  return tree;
}
