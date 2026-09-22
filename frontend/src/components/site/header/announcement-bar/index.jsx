import AnnouncementRotator from './rotator';

export default function AnnouncementBar({ announcements, locale }) {
  if (!announcements?.length) return null;

  return (
    <AnnouncementRotator
      announcements={announcements}
      labels={locale === 'en'
        ? { pause: 'Pause announcements', play: 'Play announcements', close: 'Close announcements' }
        : { pause: 'Duyuruları duraklat', play: 'Duyuruları oynat', close: 'Duyuruları kapat' }}
    />
  );
}

