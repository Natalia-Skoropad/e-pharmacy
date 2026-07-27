import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

//===================================================================

export function loadTypeScript(rootDir) {
  const rootRequire = createRequire(path.join(rootDir, 'package.json'));

  try {
    return rootRequire('typescript');
  } catch {
    const configRequire = createRequire(
      path.join(rootDir, 'packages', 'config', 'package.json')
    );
    return configRequire('typescript');
  }
}

//===================================================================

export async function parseTypeScriptFile(ts, filePath) {
  const source = await readFile(filePath, 'utf8');
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

//===================================================================

function unwrapExpression(ts, expression) {
  let current = expression;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

//===================================================================

export function evaluateLiteralExpression(ts, expression) {
  const node = unwrapExpression(ts, expression);

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((item) => evaluateLiteralExpression(ts, item));
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result = {};

    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(`Unsupported object property in ${node.getSourceFile().fileName}`);
      }

      const name = property.name;
      const key =
        ts.isIdentifier(name) || ts.isStringLiteral(name)
          ? name.text
          : name.getText(node.getSourceFile());

      result[key] = evaluateLiteralExpression(ts, property.initializer);
    }

    return result;
  }

  if (ts.isBinaryExpression(node)) {
    const left = evaluateLiteralExpression(ts, node.left);
    const right = evaluateLiteralExpression(ts, node.right);

    if (node.operatorToken.kind === ts.SyntaxKind.AsteriskToken) {
      return left * right;
    }

    if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      return left + right;
    }
  }

  throw new Error(
    `Unsupported literal expression in ${node.getSourceFile().fileName}: ${node.getText()}`
  );
}

//===================================================================

export function getVariableInitializer(ts, sourceFile, variableName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName &&
        declaration.initializer
      ) {
        return declaration.initializer;
      }
    }
  }

  throw new Error(
    `Variable ${variableName} was not found in ${sourceFile.fileName}`
  );
}

//===================================================================

export function getVariableLiteral(ts, sourceFile, variableName) {
  return evaluateLiteralExpression(
    ts,
    getVariableInitializer(ts, sourceFile, variableName)
  );
}

//===================================================================

export function getStringUnionValues(ts, sourceFile, typeName) {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isTypeAliasDeclaration(statement) ||
      statement.name.text !== typeName
    ) {
      continue;
    }

    const members = ts.isUnionTypeNode(statement.type)
      ? statement.type.types
      : [statement.type];

    return members.map((member) => {
      if (
        !ts.isLiteralTypeNode(member) ||
        !ts.isStringLiteral(member.literal)
      ) {
        throw new Error(
          `Type ${typeName} contains a non-string member in ${sourceFile.fileName}`
        );
      }

      return member.literal.text;
    });
  }

  throw new Error(`Type ${typeName} was not found in ${sourceFile.fileName}`);
}

//===================================================================

export function findPropertyCallStringArray(ts, sourceFile, propertyName) {
  let result = null;

  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ((ts.isIdentifier(node.name) && node.name.text === propertyName) ||
        (ts.isStringLiteral(node.name) && node.name.text === propertyName))
    ) {
      const initializer = unwrapExpression(ts, node.initializer);
      let candidate = ts.isArrayLiteralExpression(initializer)
        ? initializer
        : null;

      function findInlineArray(current) {
        if (candidate) return;
        const unwrapped = unwrapExpression(ts, current);

        if (ts.isArrayLiteralExpression(unwrapped)) {
          candidate = unwrapped;
          return;
        }

        if (ts.isCallExpression(unwrapped)) {
          for (const argument of unwrapped.arguments) {
            findInlineArray(argument);
          }
          findInlineArray(unwrapped.expression);
          return;
        }

        ts.forEachChild(unwrapped, findInlineArray);
      }

      findInlineArray(initializer);

      if (candidate) {
        result = candidate.elements.map((item) =>
          evaluateLiteralExpression(ts, item)
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!result) {
    throw new Error(
      `Property ${propertyName} with an inline array call was not found in ${sourceFile.fileName}`
    );
  }

  return result;
}
