import dayjs from 'dayjs';

export const notifyFormatter = (date: any) => {
  return dayjs.unix(date).format('YYYY-MM-DD HH:mm:ss');
}