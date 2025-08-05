import { StyleSheet } from 'react-native';
import { colors } from './colors';

// Loading Screen Styles
export const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text.secondary,
    marginHorizontal: 4,
  },
  dot1: {
    backgroundColor: colors.accent.blue,
  },
  dot2: {
    backgroundColor: colors.accent.purple,
  },
  dot3: {
    backgroundColor: colors.accent.cyan,
  },
  text: {
    color: colors.text.tertiary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

// Translation Loading Styles
export const translationLoadingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.secondary,
    marginHorizontal: 3,
  },
  dot1: {
    backgroundColor: colors.accent.blue,
  },
  dot2: {
    backgroundColor: colors.accent.purple,
  },
  dot3: {
    backgroundColor: colors.accent.cyan,
  },
  text: {
    color: colors.text.tertiary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Language Selector Styles
export const languageSelectorStyles = StyleSheet.create({
  modal: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    height: '80%',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    fontSize: 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background.tertiary,
  },
  selectedOption: {
    backgroundColor: colors.accent.blue,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedName: {
    color: colors.text.primary,
  },
  native: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginTop: 2,
  },
  selectedNative: {
    color: '#e0f2fe',
  },
  selectedCheck: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

// Menu Modal Styles
export const menuModalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '85%',
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: colors.text.tertiary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  items: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
});

// Language Bar Styles
export const languageBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.primary,
    justifyContent: 'space-between',
  },
  languagePairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.background.elevated,
    minWidth: 75,
  },
  flagText: {
    fontSize: 18,
    marginRight: 6,
  },
  languageText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  arrowButton: {
    marginHorizontal: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.accent.blue,
  },
  arrowText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    minWidth: 36,
    alignItems: 'center',
  },
  menuButtonText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  mirrorModeButton: {
    backgroundColor: colors.accent.purple,
  },
});

// Action Buttons Styles
export const actionButtonStyles = StyleSheet.create({
  verticalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
  },
  mirrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabled: {
    backgroundColor: colors.accent.grayDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  icon: {
    fontSize: 24,
  },
  translateButton: {
    backgroundColor: colors.accent.green,
    shadowColor: colors.accent.green,
  },
  voiceButton: {
    backgroundColor: colors.accent.red,
    shadowColor: colors.accent.red,
  },
  voiceActive: {
    backgroundColor: colors.accent.redActive,
    shadowOpacity: 0.5,
    transform: [{ scale: 1.05 }],
  },
  voiceProcessing: {
    backgroundColor: colors.accent.yellow,
    shadowColor: colors.accent.yellow,
  },
  clearButton: {
    backgroundColor: colors.accent.gray,
    shadowColor: colors.accent.gray,
  },
});

export const textAreaStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 16,
  },
  mirrorContainer: {
    backgroundColor: colors.background.tertiary,
  },
  languageLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mirrorLabel: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageLabelText: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  mirrorLabelText: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontSize: 16,
    color: colors.text.primary,
  },
  mirrorIcon: {
    fontSize: 16,
    color: colors.text.primary,
  },
  ttsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsButtonActive: {
    backgroundColor: colors.accent.blue,
  },
  ttsIcon: {
    fontSize: 16,
    color: colors.text.primary,
  },
  scrollArea: {
    flex: 1,
  },
  mirrorScrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mirrorScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  mirrorText: {
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  mirrorTextInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    textAlign: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  mirrorLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Global Layout Styles
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    flex: 1,
    padding: 20,
  },
  translationSection: {
    backgroundColor: colors.background.secondary,
  },
  inputSection: {
    backgroundColor: colors.background.tertiary,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    marginRight: 16,
  },
  floatingStopButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -40,
    backgroundColor: colors.accent.red,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: colors.accent.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingStopButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});