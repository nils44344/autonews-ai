// Top 50 automotive brands — used by generateStaticParams() so every brand
// has a pre-rendered, instantly-loading landing page at build time.
// `slug` is url-safe and matches the Brand.slug column.

export interface BrandSeed {
  slug: string;
  name: string;
  country: string;
  founded: number;
}

export const TOP_BRANDS: BrandSeed[] = [
  { slug: "tesla",        name: "Tesla",        country: "USA",     founded: 2003 },
  { slug: "toyota",       name: "Toyota",       country: "Japan",   founded: 1937 },
  { slug: "ford",         name: "Ford",         country: "USA",     founded: 1903 },
  { slug: "chevrolet",    name: "Chevrolet",    country: "USA",     founded: 1911 },
  { slug: "honda",        name: "Honda",        country: "Japan",   founded: 1948 },
  { slug: "bmw",          name: "BMW",          country: "Germany", founded: 1916 },
  { slug: "mercedes-benz",name: "Mercedes-Benz",country: "Germany", founded: 1926 },
  { slug: "audi",         name: "Audi",         country: "Germany", founded: 1909 },
  { slug: "volkswagen",   name: "Volkswagen",   country: "Germany", founded: 1937 },
  { slug: "porsche",      name: "Porsche",      country: "Germany", founded: 1931 },
  { slug: "hyundai",      name: "Hyundai",      country: "South Korea", founded: 1967 },
  { slug: "kia",          name: "Kia",          country: "South Korea", founded: 1944 },
  { slug: "nissan",       name: "Nissan",       country: "Japan",   founded: 1933 },
  { slug: "mazda",        name: "Mazda",        country: "Japan",   founded: 1920 },
  { slug: "subaru",       name: "Subaru",       country: "Japan",   founded: 1953 },
  { slug: "lexus",        name: "Lexus",        country: "Japan",   founded: 1989 },
  { slug: "acura",        name: "Acura",        country: "Japan",   founded: 1986 },
  { slug: "infiniti",     name: "Infiniti",     country: "Japan",   founded: 1989 },
  { slug: "volvo",        name: "Volvo",        country: "Sweden",  founded: 1927 },
  { slug: "jaguar",       name: "Jaguar",       country: "UK",      founded: 1922 },
  { slug: "land-rover",   name: "Land Rover",   country: "UK",      founded: 1948 },
  { slug: "mini",         name: "MINI",         country: "UK",      founded: 1959 },
  { slug: "fiat",         name: "Fiat",         country: "Italy",   founded: 1899 },
  { slug: "alfa-romeo",   name: "Alfa Romeo",   country: "Italy",   founded: 1910 },
  { slug: "ferrari",      name: "Ferrari",      country: "Italy",   founded: 1939 },
  { slug: "lamborghini",  name: "Lamborghini",  country: "Italy",   founded: 1963 },
  { slug: "maserati",     name: "Maserati",     country: "Italy",   founded: 1914 },
  { slug: "peugeot",      name: "Peugeot",      country: "France",  founded: 1810 },
  { slug: "renault",      name: "Renault",      country: "France",  founded: 1899 },
  { slug: "citroen",      name: "Citroën",      country: "France",  founded: 1919 },
  { slug: "bugatti",      name: "Bugatti",      country: "France",  founded: 1909 },
  { slug: "bentley",      name: "Bentley",      country: "UK",      founded: 1919 },
  { slug: "rolls-royce",  name: "Rolls-Royce",  country: "UK",      founded: 1904 },
  { slug: "aston-martin", name: "Aston Martin", country: "UK",      founded: 1913 },
  { slug: "mclaren",      name: "McLaren",      country: "UK",      founded: 1985 },
  { slug: "lotus",        name: "Lotus",        country: "UK",      founded: 1952 },
  { slug: "rivian",       name: "Rivian",       country: "USA",     founded: 2009 },
  { slug: "lucid",        name: "Lucid Motors", country: "USA",     founded: 2007 },
  { slug: "polestar",     name: "Polestar",     country: "Sweden",  founded: 2017 },
  { slug: "byd",          name: "BYD",          country: "China",   founded: 1995 },
  { slug: "nio",          name: "NIO",          country: "China",   founded: 2014 },
  { slug: "xpeng",        name: "XPeng",        country: "China",   founded: 2014 },
  { slug: "li-auto",      name: "Li Auto",      country: "China",   founded: 2015 },
  { slug: "geely",        name: "Geely",        country: "China",   founded: 1986 },
  { slug: "tata",         name: "Tata Motors",  country: "India",   founded: 1945 },
  { slug: "mahindra",     name: "Mahindra",     country: "India",   founded: 1945 },
  { slug: "maruti-suzuki",name: "Maruti Suzuki",country: "India",   founded: 1981 },
  { slug: "jeep",         name: "Jeep",         country: "USA",     founded: 1943 },
  { slug: "ram",          name: "Ram",          country: "USA",     founded: 2010 },
  { slug: "gmc",          name: "GMC",          country: "USA",     founded: 1911 },
];

export function findBrand(slug: string): BrandSeed | null {
  return TOP_BRANDS.find((b) => b.slug === slug) ?? null;
}
