interface SpheroidList {
    Code: number;              // EPSG
    Name: string;              // Условное название
    NameRu: string;            // Условное название
    SemiMajorAxis: number;     // Длина большой полуоси эллипсоида
    InverseFlattening: number; // Полярное сжатие эллипсоида
}

// НАЗВАНИЕ ЭЛЛИПСОИДОВ ТОЛЬКО НА РУССКОМ ИЛИ АНГЛИЙСКОМ
export const Spheroids: readonly SpheroidList[] = Object.freeze( [
    {Code:7024, Name:'Krassowsky 1940',                NameRu:'Красовский 1940',               SemiMajorAxis:6378245.0,    InverseFlattening:1./298.3},         // 0
    {Code:7024, Name:'Krassowsky 1940',                NameRu:'Красовский 1940',               SemiMajorAxis:6378245.0,    InverseFlattening:1./298.3},         // 1
    {Code:7043, Name:'WGS 72',                         NameRu:'',                              SemiMajorAxis:6378135.0,    InverseFlattening:1./298.26},        // 2
    {Code:0,    Name:'Heyford 1910',                   NameRu:'Хейфорд 1910',                  SemiMajorAxis:6378388.0,    InverseFlattening:1./297.0},         // 3 (13)
    {Code:7012, Name:'Clarke 1880 (RGS)',              NameRu:'Кларк 1880 (RGS)',              SemiMajorAxis:6378249.145,  InverseFlattening:1./293.465},       // 4
    {Code:7008, Name:'Clarke 1866',                    NameRu:'Кларк (Clarke) 1866',           SemiMajorAxis:6378206.4,    InverseFlattening:1./294.978698214}, // 5
    {Code:7044, Name:'Everest 1830 (1962 Definition)', NameRu:'Эверест 1830 (1962 Определение)',SemiMajorAxis:6377301.243, InverseFlattening:1./300.8017255},   // 6
    {Code:7004, Name:'Bessel 1841',                    NameRu:'Бессель 1841',                  SemiMajorAxis:6377397.155,  InverseFlattening:1./299.1528128},   // 7
    {Code:7001, Name:'Airy 1830',                      NameRu:'Эри (Airy) 1830',               SemiMajorAxis:6377563.396,  InverseFlattening:1./299.3249646},   // 8
    {Code:7030, Name:'WGS 84',                         NameRu:'',                              SemiMajorAxis:6378137.0,    InverseFlattening:1./298.257223563}, // 9
    {Code:7054, Name:'SGS 1985',                       NameRu:'ПЗ 90.02',                      SemiMajorAxis:6378136.0,    InverseFlattening:1./298.2578393},   // 10
    {Code:7019, Name:'GRS 1980',                       NameRu:'',                              SemiMajorAxis:6378137.0,    InverseFlattening:1./298.2572221},   // 11
    {Code:0,    Name:'IERS 1996',                      NameRu:'',                              SemiMajorAxis:6378136.49,   InverseFlattening:1./298.25645},     // 12
    {Code:7022, Name:'International 1924',             NameRu:'Международный 1924',            SemiMajorAxis:6378388.0,    InverseFlattening:1./297},           // 13
    {Code:7050, Name:'South American 1969',            NameRu:'Южно-Американский 1969',        SemiMajorAxis:6378160.0,    InverseFlattening:1./298.25},        // 14
    {Code:7021, Name:'Indonesian 1974',                NameRu:'Индонезийский 1974',            SemiMajorAxis:6378160.0,    InverseFlattening:1./298.247},       // 15
    {Code:7020, Name:'Helmert 1906',                   NameRu:'Гельмерт 1906',                 SemiMajorAxis:6378200.0,    InverseFlattening:1./298.3},         // 16
    {Code:0,    Name:'Fischer 1960 M',                 NameRu:'Фишер 1960 Модифицированный',   SemiMajorAxis:6378155.0,    InverseFlattening:1./298.3},         // 17
    {Code:0,    Name:'Fischer 1968',                   NameRu:'Фишер (Fischer) 1968',          SemiMajorAxis:6378150.0,    InverseFlattening:1./298.3},         // 18
    {Code:7053, Name:'Hough 1960',                     NameRu:'Хаф (Hough) 1960',              SemiMajorAxis:6378270.0,    InverseFlattening:1./297.0},         // 19
    {Code:7015, Name:'Everest 1830 (1937 Adjustment)', NameRu:'Эверест 1830 (1937 Корректировка)',SemiMajorAxis:6377276.345, InverseFlattening:1./300.8017},    // 20
    {Code:7003, Name:'Australian National 1921',       NameRu:'Австралийский национальный 1921',SemiMajorAxis:6378160.0,   InverseFlattening:1./298.25},        // 21
    {Code:1024, Name:'CGCS2000',                       NameRu:'',                              SemiMajorAxis:6378137,      InverseFlattening:1./298.2572221},   // 22
    {Code:7002, Name:'Airy M',                         NameRu:'Эри Модифицированный',          SemiMajorAxis:6377340.189,  InverseFlattening:1./299.3249646},   // 23
    {Code:7005, Name:'Bessel M',                       NameRu:'Бессель Модифицированный',      SemiMajorAxis:6377492.018,  InverseFlattening:1./299.1528128},   // 24
    {Code:7006, Name:'Bessel Namibia',                 NameRu:'Бессель Намибия',               SemiMajorAxis:6377483.865,  InverseFlattening:1./299.1528128},   // 25
    {Code:7046, Name:'Bessel Namibia (GLM)',           NameRu:'Бессель Намибия (GLM)',         SemiMajorAxis:6377397.155,  InverseFlattening:1./299.1528128},   // 26
    {Code:7013, Name:'Clarke 1880 (Arc)',              NameRu:'Кларк 1880 (Arc)',              SemiMajorAxis:6378249.145,  InverseFlattening:1./293.4663077},   // 27
    {Code:7014, Name:'Clarke 1880 (SGA 1922)',         NameRu:'Кларк 1880 (SGA 1922)',         SemiMajorAxis:6378249.2,    InverseFlattening:1./293.46598},     // 28
    {Code:7016, Name:'Everest 1830 (1967 Definition)', NameRu:'Эверест 1830 (1967 Определение)',SemiMajorAxis:6377298.556, InverseFlattening:1./300.8017},      // 29
    {Code:7018, Name:'Everest 1830 M',                 NameRu:'Эверест 1830 Модифицированный', SemiMajorAxis:6377304.063,  InverseFlattening:1./300.8017},      // 30
    {Code:7056, Name:'Everest 1830 (RSO 1969)',        NameRu:'Эверест 1830 (RSO 1969)',       SemiMajorAxis:6377295.664,  InverseFlattening:1./300.8017},      // 31
    {Code:7045, Name:'Everest 1830 (1975 Definition)', NameRu:'Эверест 1830 (1975 Определение)',SemiMajorAxis:6377299.151, InverseFlattening:1./300.8017255},   // 32
    {Code:7025, Name:'NWL 9D',                         NameRu:'',                              SemiMajorAxis:6378145.0,    InverseFlattening:1./298.25},        // 33
    {Code:7027, Name:'Plessis 1817',                   NameRu:'Плесси (Plessis) 1817',         SemiMajorAxis:6376523.0,    InverseFlattening:1./308.64},        // 34
    {Code:7028, Name:'Struve 1860',                    NameRu:'Струве (Struve) 1860',          SemiMajorAxis:6378298.3,    InverseFlattening:1./294.73},        // 35
    {Code:7029, Name:'War Office',                     NameRu:'',                              SemiMajorAxis:6378300.0,    InverseFlattening:1./296},           // 36
    {Code:7031, Name:'GEM 10C',                        NameRu:'',                              SemiMajorAxis:6378137.0,    InverseFlattening:1./298.2572236},   // 37
    {Code:7032, Name:'OSU86F',                         NameRu:'',                              SemiMajorAxis:6378136.2,    InverseFlattening:1./298.2572236},   // 38
    {Code:7033, Name:'OSU91A',                         NameRu:'',                              SemiMajorAxis:6378136.3,    InverseFlattening:1./298.2572236},   // 39
    {Code:7036, Name:'GRS 1967',                       NameRu:'',                              SemiMajorAxis:6378160.0,    InverseFlattening:1./298.2471674},   // 40
    {Code:7041, Name:'Average Terrestrial System 1977',NameRu:'ATS 1977',                      SemiMajorAxis:6378135.0,    InverseFlattening:1./298.257},       // 41
    {Code:7049, Name:'IAG 1975',                       NameRu:'',                              SemiMajorAxis:6378140.0,    InverseFlattening:1./298.257},       // 42
    {Code:7050, Name:'GRS 1967 M',                     NameRu:'GRS 1967 Модифицированный',     SemiMajorAxis:6378160.0,    InverseFlattening:1./298.25},        // 43
    {Code:7051, Name:'Danish 1876',                    NameRu:'Датский 1876',                  SemiMajorAxis:6377019.27,   InverseFlattening:1./300},           // 44
    {Code:0,    Name:'Sphere on WGS_84',               NameRu:'Шар на WGS 84',                 SemiMajorAxis:6378137.0,    InverseFlattening:0},                // 45
    {Code:0,    Name:'GSK-2011',                       NameRu:'ГСК-2011',                      SemiMajorAxis:6378136.5,    InverseFlattening:1./298.2564151},   // 46
    {Code:7054, Name:'SGS 1985.11',                    NameRu:'ПЗ 90.11',                      SemiMajorAxis:6378136.0,    InverseFlattening:1./298.2578393}    // 47
]);