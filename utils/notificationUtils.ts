
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Ce navigateur ne supporte pas les notifications de bureau");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendLocalNotification = (title: string, body: string, icon: string = '/favicon.ico') => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon,
    });
  }
};
