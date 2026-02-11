
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { getExcuseStats } from '@/data/excuses';
import { IconSymbol } from '@/components/IconSymbol';
import NoiseTexture from '@/components/NoiseTexture';

export default function ImportStatusScreen() {
  const stats = getExcuseStats();
  
  const totalExcusesText = `${stats.totalExcuses.toLocaleString()}`;
  const totalSituationsText = `${stats.totalSituations}`;
  const isImported = stats.totalExcuses > 100;
  
  const statusText = isImported 
    ? '✅ Master file imported successfully!' 
    : '⚠️ Waiting for master file import';
  
  const instructionText = isImported
    ? 'Your excuse database is loaded and ready to use!'
    : 'Follow the instructions below to import your master JSON file.';
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Import Status',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <View style={styles.container}>
        <NoiseTexture />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Excuse Database Import</Text>
          
          <View style={[styles.statusCard, isImported && styles.statusCardSuccess]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          
          <Text style={styles.instruction}>{instructionText}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalExcusesText}</Text>
              <Text style={styles.statLabel}>Total Excuses</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalSituationsText}</Text>
              <Text style={styles.statLabel}>Situations</Text>
            </View>
          </View>
          
          {!isImported && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>📋 How to Import:</Text>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>
                  Open the file: <Text style={styles.code}>data/excuses/master-excuses.json</Text>
                </Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>
                  Replace the entire contents with your master JSON file containing 25,962 excuses
                </Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3.</Text>
                <Text style={styles.stepText}>
                  Save the file and restart the app
                </Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4.</Text>
                <Text style={styles.stepText}>
                  Return to this screen to verify the import
                </Text>
              </View>
              
              <Text style={styles.formatTitle}>Expected Format:</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
{`{
  "Didn't do homework": [
    {
      "excuse": "My laptop crashed...",
      "believabilityRating": 85,
      "tone": "Believable",
      "length": "Elaborate story"
    }
  ],
  "Late to work": [...],
  ...
}`}
                </Text>
              </View>
            </View>
          )}
          
          {isImported && (
            <View style={styles.situationsCard}>
              <Text style={styles.situationsTitle}>📊 Loaded Situations:</Text>
              
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
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol 
              ios_icon_name="arrow.left" 
              android_material_icon_name="arrow-back" 
              size={20} 
              color="#000" 
            />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.slimeGreen,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(57, 255, 20, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusCard: {
    backgroundColor: colors.electricOrange,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusCardSuccess: {
    backgroundColor: colors.slimeGreen,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: colors.slimeGreen,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.slimeGreen,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text,
    marginTop: 5,
  },
  instructionsCard: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.electricOrange,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.electricOrange,
    marginBottom: 15,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.slimeGreen,
    marginRight: 10,
    minWidth: 25,
  },
  stepText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    padding: 2,
    borderRadius: 4,
    color: colors.slimeGreen,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slimeGreen,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.slimeGreen,
  },
  situationsCard: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.slimeGreen,
  },
  situationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.slimeGreen,
    marginBottom: 15,
  },
  situationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  situationName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  situationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.electricOrange,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slimeGreen,
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
});
