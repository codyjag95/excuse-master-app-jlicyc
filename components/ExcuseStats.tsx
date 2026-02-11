
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getExcuseStats } from '@/data/excuses';
import { colors } from '@/styles/commonStyles';

export default function ExcuseStats() {
  const stats = getExcuseStats();
  
  const totalExcusesText = `${stats.totalExcuses.toLocaleString()}`;
  const totalSituationsText = `${stats.totalSituations}`;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excuse Database Stats</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalExcusesText}</Text>
          <Text style={styles.statLabel}>Total Excuses</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalSituationsText}</Text>
          <Text style={styles.statLabel}>Situations</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Excuses by Situation:</Text>
      
      <ScrollView style={styles.situationList}>
        {stats.situations.map((situation, index) => {
          const situationName = situation;
          const count = stats.excusesBySituation[situation];
          const countText = `${count.toLocaleString()}`;
          
          return (
            <View key={index} style={styles.situationRow}>
              <Text style={styles.situationName}>{situationName}</Text>
              <Text style={styles.situationCount}>{countText}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.slimeGreen,
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#000',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  situationList: {
    maxHeight: 400,
  },
  situationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.cardBackground,
    marginBottom: 8,
    borderRadius: 8,
  },
  situationName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  situationCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slimeGreen,
  },
});
