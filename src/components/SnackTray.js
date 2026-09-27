import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FOOD_SPRITES } from '../game/assets';
import { FOOD_TYPES } from '../game/constants';

export default function SnackTray({ collectedFood }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>SNACK SET</Text>
        <Text style={styles.count}>{collectedFood.size}/6</Text>
      </View>
      <View style={styles.tray}>
        {FOOD_TYPES.map((type) => {
          const collected = collectedFood.has(type);
          return (
            <View key={type} style={[styles.slot, collected && styles.slotCollected]}>
              <Image
                source={FOOD_SPRITES[type]}
                resizeMode="contain"
                style={[styles.food, !collected && styles.foodMissing]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  title: {
    color: '#c5badf',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  count: {
    color: '#f9d65c',
    fontSize: 11,
    fontWeight: '900',
  },
  tray: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'space-between',
  },
  slot: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '#151226',
    borderColor: '#30284a',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 52,
  },
  slotCollected: {
    backgroundColor: '#2a2143',
    borderColor: '#8f6cff',
  },
  food: {
    height: '72%',
    width: '72%',
  },
  foodMissing: {
    opacity: 0.14,
  },
});
