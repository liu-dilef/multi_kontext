
## Introduction

Multi-KonText is a fork of KonText frontend, that includes the support for multimodal corpora.

## Installation

Please refer to the [INSTALL.md](./INSTALL.md) file in the current folder.

## Multimodal corpora

Multimodal corpora can be loaded into Multi-KonText by adding the following information in the Manatee vertical file:

- The **<doc\>** element must include the **url** attribute, containing a YouTube video or a path to a static audio/video file;
- Time-aligned transcription needs to include **<time\>** structural elements with the **start** attribute, representing the time in seconds.

**Example of vertical file with video source alignment**

>     <doc id="GDK563" speaker="W. Veltroni" url="https://www.youtube.com/watch?v=01wN9PMO_Yw">
    <time start='0.000'>
    Signor  NOUN    signore
    Presidente      NOUN    presidente
    ,       PUN     ,
    oggi    ADV     oggi
    sarebbe AUX:fin essere
    dovuto  VER:ppast       dovere
    finire  VER:infi        finire
    il      ART     il
    mondo   NOUN    mondo
    ,       PUN     ,
    ma      CON     ma
    non     NEG     non
    è       AUX:fin essere
    successo        VER:ppast       succedere
    ,       PUN     ,
    </time>
    <time start='5.342' />
    almeno  ADV     almeno
    fin     PRE     fin
    qui     ADV     qui
    .       SENT    .
    </time>
    </s>
    ...
    </doc>

**Example of Manatee registry file**

>     STRUCTURE doc {
        ATTRIBUTE id
        ATTRIBUTE speaker
        ATTRIBUTE url
    }

> STRUCTURE s

>     STRUCTURE time {
        ATTRIBUTE start
    }


## Original KonText documentation

The full KonText documentation is available in the **[doc](./doc)** folder.
