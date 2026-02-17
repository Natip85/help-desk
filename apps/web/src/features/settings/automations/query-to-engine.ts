import type { RuleGroupType, RuleType } from "react-querybuilder";

type EngineCondition = {
  fact: string;
  operator: string;
  value: string;
};

type EngineTopLevel =
  | { all: (EngineCondition | EngineTopLevel)[] }
  | { any: (EngineCondition | EngineTopLevel)[] };

const operatorMap: Record<string, string> = {
  "=": "equal",
  "!=": "notEqual",
  contains: "contains",
  doesNotContain: "notContains",
  beginsWith: "beginsWith",
  endsWith: "endsWith",
  ">": "greaterThan",
  ">=": "greaterThanInclusive",
  "<": "lessThan",
  "<=": "lessThanInclusive",
  in: "in",
  notIn: "notIn",
};

const arrayFields = new Set(["tags"]);

const arrayOperatorMap: Record<string, string> = {
  contains: "arrayContains",
  doesNotContain: "arrayNotContains",
};

function convertRule(rule: RuleType): EngineCondition {
  let operator = operatorMap[rule.operator] ?? rule.operator;

  if (arrayFields.has(rule.field) && arrayOperatorMap[rule.operator]) {
    operator = arrayOperatorMap[rule.operator];
  }

  return {
    fact: rule.field,
    operator,
    value: rule.value as string,
  };
}

function isRuleGroup(rule: RuleType | RuleGroupType): rule is RuleGroupType {
  return "combinator" in rule && "rules" in rule;
}

export function queryToEngine(query: RuleGroupType): EngineTopLevel {
  const children: (EngineCondition | EngineTopLevel)[] = [];

  for (const rule of query.rules) {
    if (isRuleGroup(rule)) {
      children.push(queryToEngine(rule));
    } else {
      children.push(convertRule(rule));
    }
  }

  if (query.combinator === "or") {
    return { any: children };
  }

  return { all: children };
}
