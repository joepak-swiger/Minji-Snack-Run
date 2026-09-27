import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Hud({ score, highScore, lives, stage }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <Text style={styles.stage}>STAGE {stage}</Text>
        <Text style={styles.lives}>LIVES {'♥'.repeat(Math.max(0, lives))}</Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{score.toLocaleString()}</Text>
        </View>
        <View style={[styles.scoreBlock, styles.highScoreBlock]}>
          <Text style={styles.label}>HIGH SCORE</Text>
          <Text style={styles.value}>{highScore.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 9,
    width: '100%',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  stage: {
    color: '#f4de79',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  lives: {
    color: '#ff7d9b',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreRow: {
    backgroundColor: '#0b0b18',
    borderColor: '#1a2f88',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  scoreBlock: {
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  highScoreBlock: {
    alignItems: 'flex-end',
  },
  label: {
    color: '#7f8ac4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  value: {
    color: '#ffffff',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    marginTop: 1,
  },
});
