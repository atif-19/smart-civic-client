"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

// --- New Leaflet-specific helper types to replace 'any' ---
// Replaced target: any with Record<string, unknown>
type LeafletEventHandler = (event: { target: Record<string, unknown>; [key: string]: unknown }) => void;
interface LeafletBounds {
  getSouthWest(): { lat: number; lng: number };
  getNorthEast(): { lat: number; lng: number };
  contains(latlng: [number, number]): boolean;
}

interface MapOptions {
  animate?: boolean;
  duration?: number;
  padding?: [number, number];
  maxZoom?: number;
  [key: string]: unknown;
}

// Type definitions for leaflet.heat
interface HeatLayerOptions {
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  gradient?: Record<string, string>;
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
  on(type: string, fn: LeafletEventHandler): this; // Replaced any
  off(type: string, fn?: LeafletEventHandler): this; // Replaced any
  scrollWheelZoom: {
    disable(): void;
    enable(): void;
  };
  _customIcon?: ExtendedDivIcon;
  setView(center: [number, number], zoom: number, options?: MapOptions): this; // Replaced any
  flyTo(latlng: [number, number], zoom?: number, options?: MapOptions): this; // Replaced any
  getBounds(): LeafletBounds; // Replaced any
  fitBounds(bounds: LeafletBounds, options?: MapOptions): this; // Replaced any
}

interface ExtendedLayerGroup {
  addTo(map: ExtendedMap): this;
  clearLayers(): void;
  addLayer(layer: ExtendedMarker): void;
  eachLayer(fn: (layer: ExtendedMarker) => void): void; // Replaced any
}

interface ExtendedMarker {
  bindPopup(
    content: string,
    options?: { maxWidth?: number; className?: string }
  ): this;
  on(type: string, fn: LeafletEventHandler): this; // Replaced any
  setIcon(icon: ExtendedDivIcon): this;
  getLatLng(): { lat: number; lng: number };
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
  latLngBounds(corner1: [number, number], corner2: [number, number]): LeafletBounds; // Replaced any
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
  // Change any to LeafletBounds here
  latLngBounds(corner1: [number, number], corner2: [number, number]): LeafletBounds;
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
  onReportSelect?: (report: Report) => void;
  showHeatmap?: boolean;
  showMarkers?: boolean;
  theme?: 'dark' | 'light';
}

const DashboardMap = ({ 
  reports, 
  onReportSelect,
  showHeatmap = true,
  showMarkers = true,
  theme = 'light'
}: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ExtendedMap | null>(null);
  const heatLayerRef = useRef<ExtendedHeatLayer | null>(null);
  const markerLayerRef = useRef<ExtendedLayerGroup | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mapStats, setMapStats] = useState({ total: 0, visible: 0 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized filtered reports based on selected category
  const filteredReports = useMemo(() => {
    if (!selectedCategory) return reports;
    return reports.filter(report => report.category === selectedCategory);
  }, [reports, selectedCategory]);

  // Memoized category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; color: string }> = {};
    const categoryColors: Record<string, string> = {
      Roads: "#f97316",
      Electrical: "#eab308", 
      Sanitation: "#22c55e",
      Environment: "#3b82f6",
      Infrastructure: "#a855f7",
      Other: "#6b7280"
    };

    reports.forEach(report => {
      if (!stats[report.category]) {
        stats[report.category] = {
          count: 0,
          color: categoryColors[report.category] || "#6b7280"
        };
      }
      stats[report.category].count++;
    });

    return stats;
  }, [reports]);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Debounced heatmap update function
  const debouncedUpdateHeatmap = useCallback(
    (points: [number, number, number][]) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        safeUpdateHeatmap(points);
      }, 150);
    },
    []
  );

  // Safe heatmap update function with enhanced error handling
  const safeUpdateHeatmap = useCallback(
    (points: [number, number, number][]) => {
      if (!showHeatmap || !heatLayerRef.current || !mapInstanceRef.current) return;

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
          // Filter out invalid points more strictly
          const validPoints = points.filter(([lat, lng, intensity]) => 
            !isNaN(lat) && !isNaN(lng) && !isNaN(intensity) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && intensity > 0
          );
          heatLayerRef.current.setLatLngs(validPoints);
        } else {
          heatLayerRef.current.setLatLngs([]);
        }

        // Update stats
        setMapStats(prev => ({ ...prev, visible: points.length }));
      } catch (error) {
        console.error("Error updating heatmap safely:", error);
      }
    },
    [showHeatmap]
  );

  // Enhanced marker creation with animations
  const createEnhancedMarker = useCallback((report: Report, LeafletLib: LeafletStatic, customIcon: ExtendedDivIcon) => {
    try {
      const marker = LeafletLib.marker(
        [report.location.lat, report.location.lng],
        { icon: customIcon }
      );

      const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
          Roads: "#f97316",
          Electrical: "#eab308", 
          Sanitation: "#22c55e",
          Environment: "#3b82f6",
          Infrastructure: "#a855f7",
          Other: "#6b7280"
        };
        return colors[category] || "#6b7280";
      };

      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px; border-radius: 16px; overflow: hidden; animation: fadeIn 0.3s ease-out;">
          <div style="background: linear-gradient(135deg, ${getCategoryColor(report.category)}, ${getCategoryColor(report.category)}cc); color: white; padding: 16px 20px; margin: -12px -12px 16px -12px; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);"></div>
            <div style="position: relative; z-index: 1;">
              <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.6);"></span>
                ${report.category}
              </h3>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                <div style="display: flex; align-items: center; font-size: 0.9rem; opacity: 0.95;">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="margin-right: 6px;">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                  </svg>
                  ${report.upvoteCount || 0}
                </div>
                <div style="font-size: 0.8rem; opacity: 0.8; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px;">
                  ID: ${report._id.slice(-6)}
                </div>
              </div>
            </div>
          </div>
          <div style="padding: 0 8px;">
            <p style="font-size: 0.95rem; margin: 0 0 16px; color: ${theme === 'dark' ? '#e2e8f0' : '#374151'}; line-height: 1.6; font-weight: 400;">${report.description}</p>
            ${
              report.imageUrl
                ? `<div style="margin-bottom: 12px;">
                     <img src="${report.imageUrl}" 
                          alt="${report.category}" 
                          style="width: 100%; height: auto; border-radius: 10px; max-height: 180px; object-fit: cover; box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15); transition: transform 0.2s ease;" 
                          onerror="this.style.display='none'"
                          onload="this.style.transform='scale(1.02)'; setTimeout(() => this.style.transform='scale(1)', 200)" />
                   </div>`
                : ""
            }
            ${onReportSelect ? `<div style="text-align: center; margin-top: 12px;">
              <button onclick="window.selectReport && window.selectReport('${report._id}')" 
                      style="background: linear-gradient(135deg, ${getCategoryColor(report.category)}, ${getCategoryColor(report.category)}dd); 
                             color: white; border: none; padding: 8px 16px; border-radius: 20px; 
                             font-size: 0.85rem; font-weight: 600; cursor: pointer; 
                             transition: all 0.2s ease; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                      onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 12px rgba(0,0,0,0.15)'"
                      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'">
                View Details
              </button>
            </div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: "enhanced-popup",
      });

      // Add click handler for report selection
      if (onReportSelect) {
        marker.on('click', () => {
          onReportSelect(report);
        });
      }

      return marker;
    } catch (error) {
      console.error("Error creating marker:", error);
      return null;
    }
  }, [onReportSelect, theme]);

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

        // Create enhanced custom marker icon
        const customMarkerIcon = LeafletLib.divIcon({
          html: `<div class="enhanced-marker-container">
            <div class="enhanced-marker-pin"></div>
            <div class="enhanced-marker-dot"></div>
            <div class="enhanced-marker-pulse"></div>
          </div>`,
          className: "",
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -36],
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
            // Initialize map with enhanced options
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
              zoomAnimation: true,
              fadeAnimation: true,
              markerZoomAnimation: true,
            });

            // Add enhanced tile layer based on theme
            const tileUrl = theme === 'dark' 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
            
            LeafletLib.tileLayer(tileUrl, {
              attribution: theme === 'dark' 
                ? "&copy; CARTO &copy; OpenStreetMap contributors"
                : "&copy; OpenStreetMap contributors",
              maxZoom: 18,
              opacity: theme === 'dark' ? 0.8 : 1,
            }).addTo(map);

            mapInstanceRef.current = map;

            // Initialize marker layer
            markerLayerRef.current = LeafletLib.layerGroup().addTo(map);

            // Store custom icon
            map._customIcon = customMarkerIcon;

            // Add enhanced mobile handlers
            if (isMobile) {
              let touchStartTime = 0;
              map.on("touchstart", () => {
                touchStartTime = Date.now();
                map.scrollWheelZoom.disable();
              });

              map.on("touchend", () => {
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration < 500) {
                  setTimeout(() => map.scrollWheelZoom.enable(), 800);
                } else {
                  setTimeout(() => map.scrollWheelZoom.enable(), 1200);
                }
              });
            }

            // Enhanced zoom event handlers
            let zoomTimeout: NodeJS.Timeout;
            map.on("zoomstart", () => {
              if (zoomTimeout) clearTimeout(zoomTimeout);
              if (heatLayerRef.current && mapInstanceRef.current?.hasLayer(heatLayerRef.current)) {
                try {
                  mapInstanceRef.current.removeLayer(heatLayerRef.current);
                } catch (error) {
                  console.error("Error removing heat layer on zoom start:", error);
                }
              }
            });

            map.on("zoomend", () => {
              zoomTimeout = setTimeout(() => {
                if (
                  heatLayerRef.current &&
                  mapInstanceRef.current &&
                  !mapInstanceRef.current.hasLayer(heatLayerRef.current) &&
                  showHeatmap
                ) {
                  try {
                    const container = mapContainerRef.current;
                    if (
                      container &&
                      container.offsetWidth > 0 &&
                      container.offsetHeight > 0
                    ) {
                      mapInstanceRef.current.addLayer(heatLayerRef.current);
                      // Re-add the data after zoom
                      if (filteredReports && filteredReports.length > 0) {
                        const points = filteredReports
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
                    console.error("Error re-adding heat layer on zoom end:", error);
                  }
                }
              }, 200);
            });

            // Wait for map to be fully rendered
            map.whenReady(() => {
              setTimeout(() => {
                try {
                  if (showHeatmap) {
                    const heatOptions: HeatLayerOptions = {
                      radius: isMobile ? 22 : 28,
                      blur: isMobile ? 15 : 18,
                      maxZoom: 18,
                      minOpacity: 0.3,
                      gradient: {
                        0.0: '#3b82f6',
                        0.2: '#06b6d4',
                        0.4: '#10b981',
                        0.6: '#f59e0b',
                        0.8: '#ef4444',
                        1.0: '#dc2626'
                      }
                    };

                    heatLayerRef.current = LeafletLib.heatLayer([], heatOptions);
                    map.addLayer(heatLayerRef.current);
                  }

                  // Set up enhanced resize observer
                  if (typeof ResizeObserver !== "undefined") {
                    resizeObserverRef.current = new ResizeObserver(() => {
                      if (mapInstanceRef.current) {
                        setTimeout(() => {
                          mapInstanceRef.current?.invalidateSize();
                        }, 150);
                      }
                    });
                    resizeObserverRef.current.observe(container);
                  }

                  setMapReady(true);
                  setMapStats({ total: reports.length, visible: filteredReports.length });
                } catch (error) {
                  console.error("Error creating heat layer:", error);
                  setMapReady(true);
                }
              }, 300);
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

    // Enhanced cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          // Remove all listeners for known event types
          const eventTypes = [
            "zoomstart",
            "zoomend",
            "touchstart",
            "touchend",
            "move",
            "click",
            "resize"
          ];
          eventTypes.forEach(type => {
            mapInstanceRef.current!.off(type);
          });
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
  }, [isClient, showHeatmap, theme, reports.length]);

  // Enhanced map data update
  useEffect(() => {
    if (!mapReady || !markerLayerRef.current) {
      return;
    }

    try {
      // Update heatmap with debouncing
      if (heatLayerRef.current && showHeatmap) {
        const points = filteredReports
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

        debouncedUpdateHeatmap(points);
      }

      // Update markers with enhanced performance
      if (showMarkers) {
        markerLayerRef.current.clearLayers();

        if (mapInstanceRef.current && typeof window !== "undefined") {
          // Batch marker creation for better performance
          const addMarkersInBatches = async () => {
            const leafletModule = await import("leaflet");
            const LeafletLib = leafletModule.default as unknown as LeafletStatic;
            const customIcon = mapInstanceRef.current?._customIcon;

            if (!customIcon || !markerLayerRef.current) return;

            // Process markers in batches of 10
            const batchSize = 10;
            for (let i = 0; i < filteredReports.length; i += batchSize) {
              const batch = filteredReports.slice(i, i + batchSize);
              
              await new Promise(resolve => {
                setTimeout(() => {
                  batch.forEach((report) => {
                    if (
                      !report.location ||
                      !report.location.lat ||
                      !report.location.lng ||
                      !markerLayerRef.current
                    ) {
                      return;
                    }

                    const marker = createEnhancedMarker(report, LeafletLib, customIcon);
                    if (marker) {
                      markerLayerRef.current.addLayer(marker);
                    }
                  });
                  resolve(void 0);
                }, 0);
              });
            }
          };

          addMarkersInBatches().catch((error) => {
            console.error("Error adding markers in batches:", error);
          });
        }
      }

      // Update stats
      setMapStats({ total: reports.length, visible: filteredReports.length });
    } catch (error) {
      console.error("Error updating map data:", error);
    }
  }, [filteredReports, mapReady, showHeatmap, showMarkers, createEnhancedMarker, debouncedUpdateHeatmap]);

  // Auto-fit bounds when data changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || filteredReports.length === 0) return;

    try {
      const validReports = filteredReports.filter(r => 
        r.location?.lat && r.location?.lng &&
        !isNaN(r.location.lat) && !isNaN(r.location.lng)
      );

      if (validReports.length > 1) {
        const leafletModule = import("leaflet").then(module => {
          const LeafletLib = module.default as unknown as LeafletStatic;
          const latLngs = validReports.map(r => [r.location.lat, r.location.lng]);
          // Find southwest and northeast corners
          const lats = latLngs.map(([lat, _]) => lat);
          const lngs = latLngs.map(([_, lng]) => lng);
          const southWest: [number, number] = [Math.min(...lats), Math.min(...lngs)];
          const northEast: [number, number] = [Math.max(...lats), Math.max(...lngs)];
          const bounds = LeafletLib.latLngBounds(southWest, northEast);

          mapInstanceRef.current?.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 15,
            animate: true,
            duration: 0.8
          });
        });
      }
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [filteredReports, mapReady]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-800/20"></div>
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-teal-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-slate-300 font-medium text-center">
            <div className="text-xl font-bold">Initializing Map...</div>
            <div className="text-sm text-slate-400 mt-2">Setting up enhanced features</div>
          </div>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden rounded-lg md:rounded-none">
      {/* Enhanced Control Panel */}
      {mapReady && (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-xl">
            <div className="text-xs text-white/90 font-medium">
              {mapStats.visible} of {mapStats.total} reports
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-xl max-w-xs">
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="bg-transparent text-white text-xs border-none outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-800 text-white">All Categories</option>
              {Object.entries(categoryStats).map(([category, stats]) => (
                <option key={category} value={category} className="bg-slate-800 text-white">
                  {category} ({stats.count})
                </option>
              ))}
            </select>
          </div>

        </div>
      )}

      

      <div ref={mapContainerRef} className="h-full w-full rounded-lg md:rounded-none" />
      
      {(!mapReady || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-teal-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="text-slate-300 font-medium text-center">
              <div className="text-xl font-bold">Loading Enhanced Map...</div>
              <div className="text-sm text-slate-400 mt-2">Preparing interactive features</div>
              {reports.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  Processing {reports.length} reports
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-teal-400/80 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-teal-400/80 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-3 h-3 bg-teal-400/80 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Enhanced container with subtle animations */
        .h-full.w-full.relative::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at center,
            rgba(255,233,0,0.03) 0%,
            transparent 70%);
          animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Enhanced Leaflet styling */
        :global(.leaflet-container) {
          background: ${theme === 'dark' 
            ? 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)' 
            : 'radial-gradient(ellipse at center, #f8fafc 0%, #e2e8f0 100%)'} !important;
          filter: saturate(1.15) contrast(1.05);
          transition: all 0.3s ease;
        }

        /* Premium glass zoom controls */
        :global(.leaflet-control-zoom) {
          border: none !important;
          box-shadow: none !important;
        }
        :global(.leaflet-control-zoom a) {
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
          color: #ffe900 !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(16px) saturate(180%) !important;
          box-shadow: 0 4px 12px rgba(255, 233, 0, 0.25), 0 0 20px rgba(255, 233, 0, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          margin: 2px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 34px !important;
          font-size: 20px !important;
          font-weight: bold !important;
        }
        :global(.leaflet-control-zoom a:hover) {
          background: rgba(255, 233, 0, 0.25) !important;
          color: #fff !important;
          box-shadow: 0 8px 20px rgba(255, 233, 0, 0.4), 0 0 30px rgba(255, 233, 0, 0.2) !important;
          transform: translateY(-2px) scale(1.05) !important;
        }
        :global(.leaflet-control-zoom a:active) {
          transform: translateY(0) scale(0.98) !important;
        }

        /* Enhanced custom markers with animations */
        .enhanced-marker-container {
          position: relative;
          width: 28px;
          height: 36px;
          animation: markerBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes markerBounce {
          0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
          50% { transform: translateY(-5px) scale(1.1); opacity: 0.8; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .enhanced-marker-pin {
          position: absolute;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #ffe900 0%, #ffb700 50%, #ff8c00 100%) !important;
          border: 3px solid rgba(255, 255, 255, 0.9);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          top: 0;
          left: 0;
          box-shadow: 
            0 0 12px rgba(255, 233, 0, 0.8), 
            0 0 25px rgba(255, 183, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.2) !important;
          transition: all 0.3s ease;
        }

        .enhanced-marker-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #fff !important;
          border: 1px solid rgba(255, 183, 0, 0.8);
          border-radius: 50%;
          top: 5px;
          left: 5px;
          transform: rotate(45deg);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
          transition: all 0.3s ease;
        }

        .enhanced-marker-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid rgba(255, 233, 0, 0.6);
          border-radius: 50%;
          top: -6px;
          left: -6px;
          animation: markerPulse 2s infinite;
          pointer-events: none;
        }

        @keyframes markerPulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .enhanced-marker-container:hover .enhanced-marker-pin {
          transform: rotate(-45deg) scale(1.1);
          box-shadow: 
            0 0 20px rgba(255, 233, 0, 1), 
            0 0 35px rgba(255, 183, 0, 0.6),
            0 6px 12px rgba(0, 0, 0, 0.3) !important;
        }

        .enhanced-marker-container:hover .enhanced-marker-dot {
          box-shadow: 0 0 12px rgba(255, 255, 255, 1) !important;
        }

        /* Premium popup styling */
        :global(.enhanced-popup .leaflet-popup-content-wrapper) {
          background: rgba(255, 255, 255, ${theme === 'dark' ? '0.08' : '0.95'}) !important;
          border: 1px solid rgba(255, 255, 255, ${theme === 'dark' ? '0.2' : '0.3'}) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          color: ${theme === 'dark' ? '#f8fafc' : '#1e293b'} !important;
          border-radius: 20px !important;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, ${theme === 'dark' ? '0.4' : '0.15'}),
            0 0 30px rgba(255, 233, 0, 0.1) !important;
          overflow: hidden;
          animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popupSlideIn {
          0% { 
            opacity: 0; 
            transform: translateY(10px) scale(0.9); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        :global(.enhanced-popup .leaflet-popup-content) {
          margin: 0;
          line-height: 1.4;
          color: ${theme === 'dark' ? '#e2e8f0' : '#334155'} !important;
        }

        :global(.enhanced-popup .leaflet-popup-tip) {
          background: rgba(255, 255, 255, ${theme === 'dark' ? '0.08' : '0.95'}) !important;
          border: 1px solid rgba(255, 255, 255, ${theme === 'dark' ? '0.2' : '0.3'}) !important;
          box-shadow: 0 4px 12px rgba(255, 233, 0, 0.2) !important;
        }

        :global(.enhanced-popup .leaflet-popup-close-button) {
          color: ${theme === 'dark' ? '#e2e8f0' : '#64748b'} !important;
          font-size: 20px !important;
          font-weight: bold !important;
          width: 30px !important;
          height: 30px !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }

        :global(.enhanced-popup .leaflet-popup-close-button:hover) {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #ef4444 !important;
          transform: scale(1.1) !important;
        }

        /* Enhanced mobile responsiveness */
        @media (max-width: 768px) {
          :global(.leaflet-container) {
            height: 100% !important;
            width: 100% !important;
          }
          
          .enhanced-marker-container {
            width: 24px;
            height: 32px;
          }
          
          .enhanced-marker-pin {
            width: 24px;
            height: 24px;
          }
          
          .enhanced-marker-dot {
            width: 8px;
            height: 8px;
            top: 4px;
            left: 4px;
          }
          
          .enhanced-marker-pulse {
            width: 32px;
            height: 32px;
            top: -4px;
            left: -4px;
          }

          :global(.enhanced-popup .leaflet-popup-content-wrapper) {
            max-width: 280px !important;
            margin: 8px !important;
          }
        }

        /* Smooth transitions for all interactive elements */
        :global(.leaflet-interactive) {
          transition: all 0.2s ease !important;
        }

        :global(.leaflet-interactive:hover) {
          filter: brightness(1.1) saturate(1.2) !important;
        }

        /* Custom scrollbar for mobile */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 233, 0, 0.5);
            border-radius: 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardMap;