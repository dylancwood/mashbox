MASHBOX
=====

This is a simple node application that plays video files one at a time using VLC.
It uses a simple JSON file on disk to keep track of which episode was playing when the program last exited so that it can resume that episode during the next session.
This program does not keep track of how long the current video has been playing: it relies on the VLC feature 'Continue Playback' to resume videos where you left off.


## Why?
My partner and I love MASH. I recently ripped all of our MASH DVDs to digital files. I also made a simple wooden cabinet to hold an old monitor, raspberry pi and some speakers. This program allows me to simply plug in the cabinet, and viola!... MASH starts playing. When we want to stop, we just unplug it and put the MASHbox away until next time. 

## TODO:
1. Use VLC's HTTP API to track the progress within each video so that they can be resumed exactly 10s before where they left off.
2. Use VLC's HTTP API to track when a video ends, then go to the next video (instead of when VLC exits). 
3. Add some simple controls to reverse or skip to next track.


