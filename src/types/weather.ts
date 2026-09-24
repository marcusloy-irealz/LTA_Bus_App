export interface LabelLocation {
  latitude: number;
  longitude: number;
}

export interface AreaMetadata {
  name: string;
  label_location: LabelLocation;
}

export interface AreaForecast {
  area: string;
  forecast: string;
}

export interface ValidPeriod {
  start: string;
  end: string;
  text: string;
}

export interface WeatherItem {
  update_timestamp?: string;
  timestamp?: string;
  valid_period: ValidPeriod;
  forecasts: AreaForecast[];
}

export interface TransitInfo {
  interchange: string;
  rain_shelter_available: boolean;
  service_status: string;
  commute_advice: string;
}

export interface SelectedAreaInfo {
  name: string;
  forecast: string;
  location: LabelLocation;
}

export interface WeatherApiResponse {
  code: number;
  requested_area?: string;
  selected_area?: SelectedAreaInfo;
  area?: string;
  forecast?: string;
  valid_period?: ValidPeriod;
  update_timestamp?: string;
  source?: string;
  transit_info?: TransitInfo;
  data: {
    area_metadata: AreaMetadata[];
    items: WeatherItem[];
  };
  errorMsg?: string;
}

export interface HealthApiResponse {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  message: string;
}
