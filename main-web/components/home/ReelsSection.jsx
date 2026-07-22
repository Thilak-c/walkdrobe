"use client";
import { useEffect } from "react";

const instagramReels = [
  {
    id: "reel-1",
    permalink: "https://www.instagram.com/reel/C8PlAOhorDG/",
    author: "The Patna Buzz™ (@patnabuzz.in)",
  },
  {
    id: "reel-2",
    permalink: "https://www.instagram.com/reel/DZrcmgoSdNT/",
    author: "Abhijeet Manu (@_walkdrobe.in_)",
  },
  {
    id: "reel-3",
    permalink: "https://www.instagram.com/reel/DbBPyq2SWYZ/",
    author: "Abhijeet Manu (@_walkdrobe.in_)",
  },
];

export default function ReelsSection() {
  useEffect(() => {
    // Dynamically load Instagram embed script and process blockquotes
    if (typeof window !== "undefined") {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      } else {
        const existingScript = document.getElementById("instagram-embed-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "instagram-embed-script";
          script.src = "https://www.instagram.com/embed.js";
          script.async = true;
          script.onload = () => {
            if (window.instgrm) {
              window.instgrm.Embeds.process();
            }
          };
          document.body.appendChild(script);
        }
      }
    }
  }, []);

  return (
    <section className="py-16 bg-white relative overflow-hidden border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-gray-400 text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase mb-1.5 font-inter">
            Watch On Instagram
          </p>
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 tracking-wide font-light">
            Reels & Highlights
          </h2>
        </div>

        {/* Embedded Instagram Reels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center items-start">
          {instagramReels.map((reel) => (
            <div
              key={reel.id}
              className="w-full flex justify-center max-w-[380px] overflow-hidden rounded-xl border border-gray-100 shadow-xs"
            >
              <blockquote
                className="instagram-media"
                data-instgrm-captioned
                data-instgrm-permalink={`${reel.permalink}?utm_source=ig_embed&utm_campaign=loading`}
                data-instgrm-version="14"
                style={{
                  background: "#FFF",
                  border: 0,
                  borderRadius: "8px",
                  boxShadow: "none",
                  margin: "1px",
                  maxWidth: "540px",
                  minWidth: "326px",
                  padding: 0,
                  width: "99.375%",
                }}
              >
                <div style={{ padding: "16px" }}>
                  <a
                    href={`${reel.permalink}?utm_source=ig_embed&utm_campaign=loading`}
                    style={{
                      background: "#FFFFFF",
                      lineHeight: 0,
                      padding: "0 0",
                      textAlign: "center",
                      textDecoration: "none",
                      width: "100%",
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#F4F4F4",
                          borderRadius: "50%",
                          flexGrow: 0,
                          height: "40px",
                          marginRight: "14px",
                          width: "40px",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: 1,
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "#F4F4F4",
                            borderRadius: "4px",
                            flexGrow: 0,
                            height: "14px",
                            marginBottom: "6px",
                            width: "100px",
                          }}
                        />
                        <div
                          style={{
                            backgroundColor: "#F4F4F4",
                            borderRadius: "4px",
                            flexGrow: 0,
                            height: "14px",
                            width: "60px",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ padding: "19% 0" }} />
                    <div style={{ paddingTop: "8px" }}>
                      <div
                        style={{
                          color: "#3897f0",
                          fontFamily: "Arial,sans-serif",
                          fontSize: "14px",
                          fontStyle: "normal",
                          fontWeight: 550,
                          lineHeight: "18px",
                        }}
                      >
                        View this post on Instagram
                      </div>
                    </div>
                  </a>
                  <p
                    style={{
                      color: "#c9c8cd",
                      fontFamily: "Arial,sans-serif",
                      fontSize: "14px",
                      lineHeight: "17px",
                      marginBottom: 0,
                      marginTop: "8px",
                      overflow: "hidden",
                      padding: "8px 0 7px",
                      textAlign: "center",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <a
                      href={`${reel.permalink}?utm_source=ig_embed&utm_campaign=loading`}
                      style={{
                        color: "#c9c8cd",
                        fontFamily: "Arial,sans-serif",
                        fontSize: "14px",
                        fontStyle: "normal",
                        fontWeight: "normal",
                        lineHeight: "17px",
                        textDecoration: "none",
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      A post shared by {reel.author}
                    </a>
                  </p>
                </div>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
