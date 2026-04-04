import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors } from '../../constants/theme';

export default function LoadingOverlay({ visible, text }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
  },
});
