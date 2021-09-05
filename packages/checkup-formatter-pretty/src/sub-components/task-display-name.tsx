import * as React from 'react';
import { Text } from 'ink';
import { RuleResults } from '@checkup/core';

export const TaskDisplayName: React.FC<{ taskResult: RuleResults }> = ({ taskResult }) => {
  return <Text>{taskResult.rule.properties?.taskDisplayName}</Text>;
};
