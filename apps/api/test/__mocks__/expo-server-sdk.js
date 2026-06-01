const Expo = jest.fn().mockImplementation(() => ({
  chunkPushNotifications: jest.fn((messages) => [messages]),
  sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
}));

Expo.isExpoPushToken = jest.fn(
  (token) =>
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[')),
);

module.exports = { Expo };
