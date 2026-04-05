import photo1 from "../assets/photos/hackknight_1.jpg";
import photo2 from "../assets/photos/hackknight_2.jpg";
import photo3 from "../assets/photos/hackknight_3.jpg";
import photo4 from "../assets/photos/hackknight_4.jpg";
import photo5 from "../assets/photos/hackknight_5.jpg";
import photo6 from "../assets/photos/hackknight_6.jpg";

export default function PhotoGallery() {
  const photos = [
    { src: photo1, alt: "HackKnight past event photo 1" },
    { src: photo2, alt: "HackKnight past event photo 2" },
    { src: photo3, alt: "HackKnight past event photo 3" },
    { src: photo4, alt: "HackKnight past event photo 4" },
    { src: photo5, alt: "HackKnight past event photo 5" },
    { src: photo6, alt: "HackKnight past event photo 6" },
  ];
  
    return (
      <section id = "gallery" className="section-wrapper py-24">                                       {/* section wrapper for the gallery block */}
        <h2 className="section-title text-center">Photo Gallery of Past Events</h2>         {/* section heading — matches the screenshot */}
  
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">                                         {/* gallery grid container — teammate adds CSS grid */}
          {photos.map((photo, index) => (             // loop over each photo object
            <img                                      // render an image element for each photo
              key={index}                             // key is required by React when rendering a list
              src={photo.src}                         // file path to the image
              alt={photo.alt}                         // alt text is required for accessibility (screen readers)
              className="w-full h-48 md:h-64 object-cover rounded-card hover:opacity-80 transition-opacity cursor-pointer border border-border bg-surface"
            />
          ))}
        </div>
  
      </section>
    );
  }