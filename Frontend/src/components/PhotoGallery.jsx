export default function PhotoGallery() {

    // Array of photo objects — replace src values with real image paths once photos are added
    const photos = [                                  // each object has a src (file path) and alt (accessibility description)
      { src: "/assets/photos/photo1.jpg", alt: "HackKnight past event photo 1" },
      { src: "/assets/photos/photo2.jpg", alt: "HackKnight past event photo 2" },
      { src: "/assets/photos/photo3.jpg", alt: "HackKnight past event photo 3" },
      { src: "/assets/photos/photo4.jpg", alt: "HackKnight past event photo 4" },
      { src: "/assets/photos/photo5.jpg", alt: "HackKnight past event photo 5" },
      { src: "/assets/photos/photo6.jpg", alt: "HackKnight past event photo 6" },
    ];
  
    return (
      <section>                                       {/* section wrapper for the gallery block */}
        <h2>Photo Gallery of Past Events</h2>         {/* section heading — matches the screenshot */}
  
        <div>                                         {/* gallery grid container — teammate adds CSS grid */}
          {photos.map((photo, index) => (             // loop over each photo object
            <img                                      // render an image element for each photo
              key={index}                             // key is required by React when rendering a list
              src={photo.src}                         // file path to the image
              alt={photo.alt}                         // alt text is required for accessibility (screen readers)
            />
          ))}
        </div>
  
      </section>
    );
  }