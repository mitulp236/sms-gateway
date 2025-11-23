import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    width: 40,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statusBadge: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
  },
  showButton: {
    paddingHorizontal: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  testButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  successBanner: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  successText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  sendingText: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageCount: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesList: {
    maxHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    fontStyle: 'italic',
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  infoSectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
