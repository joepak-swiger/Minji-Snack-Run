import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DIRECTION } from '../game/constants';

function DirectionButton({ label, direction, onDirection, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={() => onDirection(direction)}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export default function DPad({ onDirection }) {
  return (
    <View style={styles.container} accessibilityLabel="Movement controls">
      <View style={styles.row}>
        <View style={styles.spacer} />
        <DirectionButton
          label="▲"
          direction={DIRECTION.UP}
          onDirection={onDirection}
          accessibilityLabel="Move up"
        />
        <View style={styles.spacer} />
      </View>

      <View style={styles.row}>
        <DirectionButton
          label="◀"
          direction={DIRECTION.LEFT}
          onDirection={onDirection}
          accessibilityLabel="Move left"
        />
        <View style={styles.center} />
        <DirectionButton
          label="▶"
          direction={DIRECTION.RIGHT}
          onDirection={onDirection}
          accessibilityLabel="Move right"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.spacer} />
        <DirectionButton
          label="▼"
          direction={DIRECTION.DOWN}
          onDirection={onDirection}
          accessibilityLabel="Move down"
        />
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const SIZE = 52;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2b2149',
    borderColor: '#8f6cff',
    borderRadius: 14,
    borderWidth: 1,
    height: SIZE,
    justifyContent: 'center',
    margin: 2,
    width: SIZE,
  },
  buttonPressed: {
    backgroundColor: '#58418f',
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  spacer: {
    height: SIZE + 4,
    width: SIZE + 4,
  },
  center: {
    backgroundColor: '#171326',
    borderRadius: 12,
    height: SIZE,
    margin: 2,
    width: SIZE,
  },
});
