/** Representative viewport buckets for manual Chrome DevTools responsive testing. */
export const VIEWPORT_TEST_BUCKETS = [
  { id: "xs-phone", label: "XS phone (iPhone SE, Lumia 520)", width: 320, height: 568 },
  { id: "sm-phone", label: "SM phone (Pixel 7, Galaxy S8)", width: 390, height: 844 },
  { id: "lg-phone", label: "LG phone (iPhone 14 Pro Max)", width: 430, height: 932 },
  { id: "fold-narrow", label: "Fold narrow (Galaxy Z Fold 5)", width: 344, height: 882 },
  { id: "tablet-portrait", label: "Tablet portrait (iPad Mini)", width: 768, height: 1024 },
  { id: "tablet-landscape", label: "Tablet landscape / Nest Hub", width: 1024, height: 600 },
  { id: "desktop", label: "Desktop", width: 1280, height: 800 },
] as const;

export type ViewportTestBucket = (typeof VIEWPORT_TEST_BUCKETS)[number];
