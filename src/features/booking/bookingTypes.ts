export interface Store {
  _id: string;
  store_name: string;
  store_address: string;
  store_open_time: string;
  store_close_time: string;
  location: Location;
  distance?: number;
  is_online: boolean;
}
