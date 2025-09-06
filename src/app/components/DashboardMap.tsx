"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Type definitions for leaflet.heat
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
}

// Extended Leaflet types
interface ExtendedHeatLayer {
  setLatLngs(latlngs: Array<[number, number] | [number, number, number]>): this;
  addTo(map: ExtendedMap): this;
  remove(): this;
  _canvas?: HTMLCanvasElement;
  _map?: ExtendedMap;
}

interface ExtendedMap {
  addLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): this;
  removeLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): this;
  hasLayer(layer: ExtendedHeatLayer | ExtendedLayerGroup): boolean;
  remove(): void;
  invalidateSize(): void;
  whenReady(callback: () => void): void;
  on(type: string, fn: () => void): this;
  scrollWheelZoom: {
    disable(): void;
    enable(): void;
  };
  _customIcon?: ExtendedDivIcon;
}

interface ExtendedLayerGroup {
  addTo(map: ExtendedMap): this;
  clearLayers(): void;
  addLayer(layer: ExtendedMarker): void;
}

interface ExtendedMarker {
  bindPopup(
    content: string,
    options?: { maxWidth?: number; className?: string }
  ): this;
}

interface ExtendedDivIcon {
  options: {
    html: string;
    className: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor: [number, number];
  };
}

interface ExtendedTileLayer {
  addTo(map: ExtendedMap): this;
}

interface LeafletStatic {
  map(element: HTMLElement, options?: Record<string, unknown>): ExtendedMap;
  tileLayer(
    urlTemplate: string,
    options?: Record<string, unknown>
  ): ExtendedTileLayer;
  layerGroup(): ExtendedLayerGroup;
  marker(
    latlng: [number, number],
    options?: { icon?: ExtendedDivIcon }
  ): ExtendedMarker;
  divIcon(options: {
    html: string;
    className: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor: [number, number];
  }): ExtendedDivIcon;
  heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>,
    options?: HeatLayerOptions
  ): ExtendedHeatLayer;
  Icon: {
    Default: {
      prototype: Record<string, unknown>;
      mergeOptions(options: Record<string, string>): void;
    };
  };
}

interface Report {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  location: { lat: number; lng: number };
  upvoteCount: number;
}

interface MapProps {
  reports: Report[];
}

const DashboardMap = ({ reports }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ExtendedMap | null>(null);
  const heatLayerRef = useRef<ExtendedHeatLayer | null>(null);
  const markerLayerRef = useRef<ExtendedLayerGroup | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safe heatmap update function
  const safeUpdateHeatmap = useCallback(
    (points: [number, number, number][]) => {
      if (!heatLayerRef.current || !mapInstanceRef.current) return;

      try {
        const container = mapContainerRef.current;
        if (
          !container ||
          container.offsetWidth <= 0 ||
          container.offsetHeight <= 0
        ) {
          return;
        }

        // Check if the heatmap layer is added to the map
        const heatLayer = heatLayerRef.current;
        const map = mapInstanceRef.current;
        if (map && heatLayer && !map.hasLayer(heatLayer)) {
          return;
        }

        // Only update if we have valid points
        if (points.length > 0) {
          heatLayerRef.current.setLatLngs(points);
        } else {
          heatLayerRef.current.setLatLngs([]);
        }
      } catch (error) {
        console.error("Error updating heatmap safely:", error);
      }
    },
    []
  );

  // Initialize map only on client side
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    const initializeMap = async () => {
      try {
        // Dynamic import of Leaflet to ensure it's loaded on client side only
        const leafletModule = await import("leaflet");
        const LeafletLib = leafletModule.default as unknown as LeafletStatic;
        // Import leaflet.heat plugin
        await import("leaflet.heat");

        // Fix for default markers in Next.js
        delete LeafletLib.Icon.Default.prototype._getIconUrl;
        LeafletLib.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Create custom marker icon
        const customMarkerIcon = LeafletLib.divIcon({
          html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/></svg>`,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        });

        // Wait for container to have proper dimensions
        const initWithProperDimensions = () => {
          const container = mapContainerRef.current;
          if (
            !container ||
            container.offsetWidth <= 0 ||
            container.offsetHeight <= 0
          ) {
            setTimeout(initWithProperDimensions, 100);
            return;
          }

          try {
            // Initialize map with mobile-friendly options
            const isMobile = window.innerWidth < 768;
            const map = LeafletLib.map(container, {
              center: [23.0225, 72.5714],
              zoom: isMobile ? 11 : 12,
              zoomControl: true,
              scrollWheelZoom: !isMobile,
              touchZoom: true,
              tap: true,
              maxZoom: 18,
              minZoom: 8,
              preferCanvas: true,
            });

            // Add tile layer
            LeafletLib.tileLayer(
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 18,
              }
            ).addTo(map);

            mapInstanceRef.current = map;

            // Initialize marker layer first
            markerLayerRef.current = LeafletLib.layerGroup().addTo(map);

            // Store custom icon for later use
            map._customIcon = customMarkerIcon;

            // Add mobile-specific event handlers
            if (isMobile) {
              map.on("touchstart", () => {
                map.scrollWheelZoom.disable();
              });

              map.on("touchend", () => {
                setTimeout(() => map.scrollWheelZoom.enable(), 1000);
              });
            }

            // Wait for map to be fully rendered before adding heat layer
            map.whenReady(() => {
              setTimeout(() => {
                try {
                  const heatOptions: HeatLayerOptions = {
                    radius: isMobile ? 20 : 25,
                    blur: isMobile ? 12 : 15,
                    maxZoom: 18,
                    minOpacity: 0.4,
                  };

                  // Create heatmap layer but don't add data yet
                  heatLayerRef.current = LeafletLib.heatLayer([], heatOptions);
                  map.addLayer(heatLayerRef.current);

                  // Set up resize observer to handle container size changes
                  if (typeof ResizeObserver !== "undefined") {
                    resizeObserverRef.current = new ResizeObserver(() => {
                      if (mapInstanceRef.current) {
                        setTimeout(() => {
                          mapInstanceRef.current?.invalidateSize();
                        }, 100);
                      }
                    });
                    resizeObserverRef.current.observe(container);
                  }

                  setMapReady(true);
                } catch (error) {
                  console.error("Error creating heat layer:", error);
                  setMapReady(true); // Still set ready so markers can be added
                }
              }, 200);
            });

            // Handle zoom events to prevent heatmap errors
            map.on("zoomstart", () => {
              if (
                heatLayerRef.current &&
                mapInstanceRef.current?.hasLayer(heatLayerRef.current)
              ) {
                try {
                  mapInstanceRef.current.removeLayer(heatLayerRef.current);
                } catch (error) {
                  console.error(
                    "Error removing heat layer on zoom start:",
                    error
                  );
                }
              }
            });

            map.on("zoomend", () => {
              if (
                heatLayerRef.current &&
                mapInstanceRef.current &&
                !mapInstanceRef.current.hasLayer(heatLayerRef.current)
              ) {
                setTimeout(() => {
                  try {
                    const container = mapContainerRef.current;
                    if (
                      container &&
                      container.offsetWidth > 0 &&
                      container.offsetHeight > 0 &&
                      heatLayerRef.current &&
                      mapInstanceRef.current
                    ) {
                      mapInstanceRef.current.addLayer(heatLayerRef.current);
                      // Re-add the data after zoom
                      if (reports && reports.length > 0) {
                        const points = reports
                          .filter(
                            (r) =>
                              r.location &&
                              r.location.lat &&
                              r.location.lng &&
                              !isNaN(r.location.lat) &&
                              !isNaN(r.location.lng) &&
                              r.location.lat >= -90 &&
                              r.location.lat <= 90 &&
                              r.location.lng >= -180 &&
                              r.location.lng <= 180
                          )
                          .map(
                            (r) =>
                              [
                                r.location.lat,
                                r.location.lng,
                                Math.max(r.upvoteCount || 1, 1),
                              ] as [number, number, number]
                          );

                        safeUpdateHeatmap(points);
                      }
                    }
                  } catch (error) {
                    console.error(
                      "Error re-adding heat layer on zoom end:",
                      error
                    );
                  }
                }, 300);
              }
            });
          } catch (error) {
            console.error("Error initializing map:", error);
          }
        };

        initWithProperDimensions();
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          heatLayerRef.current = null;
          markerLayerRef.current = null;
          setMapReady(false);
        } catch (error) {
          console.error("Error cleaning up map:", error);
        }
      }
    };
  }, [isClient, safeUpdateHeatmap, reports]);

  // Update map data when reports change
  useEffect(() => {
    if (!mapReady || !markerLayerRef.current || !reports) {
      return;
    }

    try {
      // Update heatmap safely
      if (heatLayerRef.current) {
        const points = reports
          .filter(
            (r) =>
              r.location &&
              r.location.lat &&
              r.location.lng &&
              !isNaN(r.location.lat) &&
              !isNaN(r.location.lng) &&
              r.location.lat >= -90 &&
              r.location.lat <= 90 &&
              r.location.lng >= -180 &&
              r.location.lng <= 180
          )
          .map(
            (r) =>
              [
                r.location.lat,
                r.location.lng,
                Math.max(r.upvoteCount || 1, 1),
              ] as [number, number, number]
          );

        // Use safe update function
        setTimeout(() => safeUpdateHeatmap(points), 100);
      }

      // Clear existing markers
      markerLayerRef.current.clearLayers();

      // Add new markers
      if (mapInstanceRef.current && typeof window !== "undefined") {
        // Get leaflet from window after dynamic import
        const leafletModule = import("leaflet")
          .then((module) => {
            const LeafletLib = module.default as unknown as LeafletStatic;
            const customIcon = mapInstanceRef.current?._customIcon;

            if (!customIcon) return;

            reports.forEach((report) => {
              if (
                !report.location ||
                !report.location.lat ||
                !report.location.lng ||
                !markerLayerRef.current
              ) {
                return;
              }

              try {
                const marker = LeafletLib.marker(
                  [report.location.lat, report.location.lng],
                  {
                    icon: customIcon,
                  }
                );

                const popupContent = `
                <div style="font-family: sans-serif; max-width: 200px;">
                  <h3 style="font-size: 1rem; font-weight: bold; margin: 0 0 4px; word-wrap: break-word;">${
                    report.category
                  }</h3>
                  <p style="font-size: 0.875rem; margin: 0 0 8px; word-wrap: break-word;">${
                    report.description
                  }</p>
                  ${
                    report.imageUrl
                      ? `<img src="${report.imageUrl}" alt="${report.category}" style="width: 100%; height: auto; border-radius: 4px; max-height: 150px; object-fit: cover;" onerror="this.style.display='none'" />`
                      : ""
                  }
                </div>
              `;

                marker.bindPopup(popupContent, {
                  maxWidth: 250,
                  className: "custom-popup",
                });

                markerLayerRef.current.addLayer(marker);
              } catch (error) {
                console.error("Error adding marker:", error);
              }
            });
          })
          .catch((error) => {
            console.error("Error importing leaflet for markers:", error);
          });
      }
    } catch (error) {
      console.error("Error updating map data:", error);
    }
  }, [reports, mapReady, safeUpdateHeatmap]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-300">
        <div className="text-gray-600">Loading Map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300 bg-opacity-75">
          <div className="text-gray-600">Initializing Map...</div>
        </div>
      )}
    </div>
  );
};

export default DashboardMap;
